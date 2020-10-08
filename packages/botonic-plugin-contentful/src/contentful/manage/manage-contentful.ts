import { ManageCms } from '../../manage-cms/manage-cms'
import { CmsException, ContentId } from '../../cms'
import * as nlp from '../../nlp'
import { Locale } from '../../nlp'
import { createClient } from 'contentful-management'
// eslint-disable-next-line node/no-missing-import
import { ClientAPI } from 'contentful-management/dist/typings/create-contentful-api'
// eslint-disable-next-line node/no-missing-import
import { Environment } from 'contentful-management/dist/typings/entities/environment'
// eslint-disable-next-line node/no-missing-import
import { Entry } from 'contentful-management/dist/typings/entities/entry'
// eslint-disable-next-line node/no-missing-import
import { Asset } from 'contentful-management/dist/typings/entities/asset'
import { ContentfulOptions } from '../../plugin'
import { ManageContext } from '../../manage-cms/manage-context'
import {
  CONTENT_FIELDS,
  ContentField,
  ContentFieldType,
} from '../../manage-cms/fields'

export class ManageContentful implements ManageCms {
  readonly manage: ClientAPI
  environment: Environment | undefined

  constructor(readonly options: ContentfulOptions) {
    this.manage = this.createClient()
  }

  private createClient() {
    return createClient({
      accessToken: this.options.accessToken,
      timeout: this.options.timeoutMs,
    })
  }

  async getDefaultLocale(): Promise<Locale> {
    const space = await this.manage.getSpace(this.options.spaceId)
    const locales = await (await this.getEnvironment()).getLocales()
    for (const locale of locales.items) {
      if (locale.default) {
        return locale.code
      }
    }
    throw new Error(`No default locale found for space ${space.sys.id}`)
  }

  private async getEnvironment(): Promise<Environment> {
    if (!this.environment) {
      const space = await this.manage.getSpace(this.options.spaceId)
      if (!this.options.environment) {
        throw new Error('Please specify environment in ContentfulOptions')
      }
      this.environment = await space.getEnvironment(this.options.environment)
    }
    return this.environment
  }

  async updateField(
    context: ManageContext,
    contentId: ContentId,
    fieldType: ContentFieldType,
    value: any,
    code?: string
  ): Promise<void> {
    const environment = await this.getEnvironment()
    const oldEntry = await environment.getEntry(contentId.id)

    const field = this.checkOverwrite(context, oldEntry, fieldType, true)
    oldEntry.fields[field.cmsName][context.locale] = value
    if (code) this.replaceCode(code, oldEntry)

    // we could use this.deliver.contentFromEntry & IgnoreFallbackDecorator to convert
    // the multilocale fields returned by update()
    await this.writeEntry(context, oldEntry)
  }

  replaceCode(code: string, entry: Entry) {
    for (const locale in entry.fields.name) {
      entry.fields.name[locale] = code
    }
  }

  async removeAssetFile(
    context: ManageContext,
    assetId: string
  ): Promise<void> {
    const environment = await this.getEnvironment()
    const asset = await environment.getAsset(assetId)
    delete asset.fields.file[context.locale]
    await this.writeAsset({ ...context, allowOverwrites: true }, asset)
  }

  async copyAssetFile(
    context: ManageContext,
    assetId: string,
    fromLocale: nlp.Locale
  ): Promise<void> {
    const environment = await this.getEnvironment()
    const oldAsset = await environment.getAsset(assetId)
    if (!context.allowOverwrites && oldAsset.fields.file[context.locale]) {
      throw new Error(
        `Cannot overwrite asset '${assetId}' because it's not empty and ManageContext.allowOverwrites is false`
      )
    }
    const fromFile = oldAsset.fields.file[fromLocale]
    if (!fromFile) {
      throw Error(`Asset '${assetId}' has no file for locale ${fromLocale}`)
    }
    oldAsset.fields.file[context.locale] = fromFile
    // we could use this.deliver.contentFromEntry & IgnoreFallbackDecorator to convert
    // the multilocale fields returned by update()
    await this.writeAsset(context, oldAsset)
  }

  private checkOverwrite(
    context: ManageContext,
    entry: Entry,
    fieldType: ContentFieldType,
    failIfMissing: boolean
  ): ContentField {
    const field = CONTENT_FIELDS.get(fieldType)
    if (!field) {
      throw new CmsException(`Invalid field type ${fieldType}`)
    }
    if (!context.locale) {
      // paranoic check
      throw new Error('Context.locale must be defined')
    }
    if (!(field.cmsName in entry.fields)) {
      if (!failIfMissing) {
        return field
      }
      const fields = Object.keys(entry.fields)
      throw new CmsException(
        `Field '${field.cmsName}' not found in entry of type '${
          entry.sys.contentType.sys.id
        }. It only has ${JSON.stringify(fields)}'`
      )
    }
    if (!context.allowOverwrites) {
      const value = entry.fields[field.cmsName][context.locale]
      if (value) {
        throw new CmsException(
          `Cannot overwrite field '${field.cmsName}' of entry '${
            entry.sys.id
          }' "+
          "(has value '${String(
            value
          )}') because ManageContext.allowOverwrites is false`
        )
      }
    }
    return field
  }

  async copyField(
    context: ManageContext,
    contentId: ContentId,
    fieldType: ContentFieldType,
    fromLocale: nlp.Locale,
    onlyIfTargetEmpty: boolean
  ): Promise<void> {
    const environment = await this.getEnvironment()
    const oldEntry = await environment.getEntry(contentId.id)
    const field = this.checkOverwrite(context, oldEntry, fieldType, false)

    const fieldEntry = oldEntry.fields[field.cmsName]
    if (fieldEntry == undefined) {
      return
    }
    if (onlyIfTargetEmpty && context.locale in fieldEntry) {
      return
    }
    fieldEntry[context.locale] = fieldEntry[fromLocale]
    await this.writeEntry(context, oldEntry)
  }

  private async writeEntry(
    context: ManageContext,
    entry: Entry
  ): Promise<void> {
    if (context.dryRun) {
      console.log('Not updating due to dryRun mode')
      return
    }
    const updated = await entry.update()
    if (!context.preview) {
      await updated.publish()
    }
  }

  private async writeAsset(
    context: ManageContext,
    asset: Asset
  ): Promise<void> {
    if (context.dryRun) {
      console.log('Not updating due to dryRun mode')
      return
    }
    const updated = await asset.update()
    if (!context.preview) {
      await updated.publish()
    }
  }
}
