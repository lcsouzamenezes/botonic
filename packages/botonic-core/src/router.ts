import { RouteInspector } from './debug/inspector'
import { NoMatchingRouteError } from './errors'
import { Input, Route, Routes, Session } from './index'
import { isFunction } from './utils'

interface RouteParams {
  route: Route
  params: any
}
type MatchingProp =
  | 'text'
  | 'payload'
  | 'intent'
  | 'type'
  | 'input'
  | 'session'
  | 'request'

type Matcher = string | RegExp | ((args) => boolean)

export class Router {
  routes: Routes
  routeInspector: RouteInspector
  lastRoutePath: string | null
  /**
   * @param {Route[]} routes
   * @param routeInspector
   */
  constructor(
    routes: Routes,
    routeInspector: RouteInspector | undefined = undefined
  ) {
    this.routes = routes
    this.routeInspector = routeInspector || new RouteInspector()
  }

  // eslint-disable-next-line complexity
  processInput(
    input: Input,
    session: Partial<Session> = {},
    lastRoutePath: string | null = null
  ): any {
    let routeParams: any = {}
    if (input.payload && input.payload.includes('__PATH_PAYLOAD__')) {
      const pathParam = input.payload.split('__PATH_PAYLOAD__')
      routeParams.route = this.getRouteByPath(pathParam[1], this.routes)
    }
    const pathParams = this.getOnFinishParams(input)
    let brokenFlow = false
    const lastRoute = this.getRouteByPath(lastRoutePath, this.routes)
    if (!lastRoute && input.path)
      routeParams.route = this.getRouteByPath(input.path, this.routes)
    if (lastRoute && lastRoute.childRoutes && !routeParams.route)
      //get route depending of current ChildRoute
      routeParams = this.getRoute(
        input,
        lastRoute.childRoutes,
        session as Session,
        lastRoutePath
      )
    if (!routeParams || !Object.keys(routeParams).length) {
      /*
          we couldn't find a route in the state of the lastRoute, so let's find in
          the general conf.route
        */
      brokenFlow = Boolean(lastRoutePath)
      routeParams = this.getRoute(
        input,
        this.routes,
        session as Session,
        lastRoutePath
      )
    }
    try {
      if (pathParams) {
        const searchParams = new URLSearchParams(pathParams)
        for (const [key, value] of searchParams) {
          routeParams.params
            ? (routeParams.params[key] = value)
            : (routeParams.params = { [key]: value })
        }
      }
    } catch (e) {}
    if (routeParams && Object.keys(routeParams).length) {
      //get in childRoute if one has path ''
      let defaultAction
      if (routeParams.route) {
        if (
          !routeParams.route.path &&
          routeParams.route.childRoutes &&
          routeParams.route.childRoutes.length
        ) {
          defaultAction = this.getRoute(
            { path: '' },
            routeParams.route.childRoutes,
            session as Session,
            lastRoutePath
          )
        }
        if ('action' in routeParams.route) {
          if (
            brokenFlow &&
            routeParams.route.ignoreRetry != true &&
            lastRoute &&
            (session.__retries || 0) < (lastRoute.retry || 0) &&
            routeParams.route.path != lastRoute.action
          ) {
            session.__retries = session.__retries ? session.__retries + 1 : 1
            // The flow was broken, but we want to recover it
            return {
              action: routeParams.route.action,
              params: routeParams.params,
              retryAction: lastRoute ? lastRoute.action : null,
              defaultAction: defaultAction ? defaultAction.route.action : null,
              lastRoutePath: lastRoutePath,
            }
          } else {
            session.__retries = 0
            if (lastRoutePath && !brokenFlow)
              lastRoutePath = `${lastRoutePath}/${routeParams.route.path}`
            else lastRoutePath = routeParams.route.path
            return {
              action: routeParams.route.action,
              params: routeParams.params,
              retryAction: null,
              defaultAction: defaultAction ? defaultAction.route.action : null,
              lastRoutePath: lastRoutePath,
            }
          }
        } else if (defaultAction) {
          return {
            action: defaultAction.route.action,
            params: defaultAction.params,
            lastRoutePath: lastRoutePath,
          }
        } else if ('redirect' in routeParams.route) {
          lastRoutePath = routeParams.route.redirect
          const redirectRoute = this.getRouteByPath(lastRoutePath, this.routes)
          if (redirectRoute) {
            return {
              action: redirectRoute.action,
              params: redirectRoute.params,
              lastRoutePath: lastRoutePath,
            }
          }
        }
      }
    }
    const notFound = this.getRouteByPath('404', this.routes)
    if (!notFound) throw new NoMatchingRouteError(input)
    if (lastRoute && (session.__retries || 0) < (lastRoute.retry || 0)) {
      session.__retries = session.__retries ? session.__retries + 1 : 1
      return {
        action: notFound.action,
        params: {},
        retryAction: lastRoute.action,
        lastRoutePath: lastRoutePath,
      }
    } else {
      this.lastRoutePath = null
      session.__retries = 0
      return {
        action: notFound.action,
        params: {},
        retryAction: null,
        lastRoutePath: lastRoutePath,
      }
    }
  }

  getOnFinishParams(input: Input): string | undefined {
    try {
      if (!input.payload) {
        return undefined
      }
      const params = input.payload.split('__PATH_PAYLOAD__')
      if (params.length < 2) {
        return undefined
      }
      const pathParams = params[1].split('?')
      if (pathParams.length > 0) {
        input.path = pathParams[0]
        delete input.payload
      }
      if (pathParams.length > 1) {
        return pathParams[1]
      }
    } catch (e) {
      console.error('ERROR getOnFinishParams', e)
    }
    return undefined
  }

  /**
   * @return {null|RouteParams}
   */
  getRoute(
    input: Input | Partial<Input>,
    routes: Routes,
    session: Session,
    lastRoutePath: string | null
  ): RouteParams | null {
    const computedRoutes = isFunction(routes)
      ? // @ts-ignore
        routes({ input, session, lastRoutePath })
      : routes
    /* Find the route that matches the given input, if it match with some of the entries,
      return the whole Route of the entry with optional params captured if matcher was a regex */
    /** @type {{ [key: string]: string }}*/
    let params = {}
    const route = computedRoutes.find(r =>
      Object.entries(r)
        .filter(([key, _]) => key != 'action' && key != 'childRoutes')
        .some(([key, value]) => {
          const match = this.matchRoute(
            r,
            key as MatchingProp,
            value as Matcher,
            input as Input,
            session,
            lastRoutePath
          )
          try {
            params = match.groups
          } catch (e) {}
          return Boolean(match)
        })
    )
    if (route) {
      return { route, params }
    }
    return null
  }

  getRouteByPath(
    path: string | null,
    routeList: Routes | null = null
  ): Route | null {
    if (!path) return null
    let route: Route | null = null
    routeList = routeList || this.routes
    const [currentPath, ...childPath] = path.split('/')
    if (Array.isArray(routeList)) {
      for (const r of routeList) {
        //iterate over all routeList
        if (r.path == currentPath) {
          route = r
          if (r.childRoutes && r.childRoutes.length && childPath.length > 0) {
            //evaluate childroute over next actions
            route = this.getRouteByPath(childPath.join('/'), r.childRoutes)
            if (route) return route
          } else if (childPath.length === 0) return route //last action and found route
        }
      }
    }
    return null
  }

  /**
   * @return {Params|boolean}
   */
  matchRoute(
    route: Route,
    prop: MatchingProp,
    matcher: Matcher,
    input: Input,
    session: Session,
    lastRoutePath: string | null
  ): any {
    /*
        prop: ('text' | 'payload' | 'intent' | 'type' | 'input' | 'session' | 'request' ...)
        matcher: (string: exact match | regex: regular expression match | function: return true)
        input: user input object, ex: {type: 'text', data: 'Hi'}
      */
    /** @type {any} */
    let value: any = ''
    if (Object.keys(input).indexOf(prop) > -1) value = input[prop]
    if (prop === 'text') {
      if (input.type === 'text') value = input.data
    } else if (prop === 'input') value = input
    else if (prop === 'session') value = session
    else if (prop === 'request') value = { input, session, lastRoutePath }
    const matched = this.matchValue(matcher, value)
    if (matched) {
      this.routeInspector.routeMatched(route, prop, matcher, value)
    } else {
      this.routeInspector.routeNotMatched(route, prop, matcher, value)
    }
    return matched
  }

  /**
   *
   * @return {*|boolean|Params}
   */
  matchValue(
    matcher: string | RegExp | ((args) => boolean),
    value: any
  ): boolean {
    if (typeof matcher === 'string') {
      // TODO should this be === to avoid matching '' with undefined?
      return value == matcher
    }
    if (matcher instanceof RegExp) {
      // check if undefined to avoid conversion to 'undefined'
      if (value === undefined) {
        return false
      }
      return Boolean(matcher.exec(value))
    }
    if (typeof matcher === 'function') {
      return matcher(value)
    }
    return false
  }
}
