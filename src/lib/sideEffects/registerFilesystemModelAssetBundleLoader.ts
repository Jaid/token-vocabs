import {registerModelAssetBundleLoader} from '../data.ts'
import {modelAssetBundleUrls} from '../modelAssetBundleUrls.ts'
import {FilesystemModelAssetBundleLoader} from '../modelAssets/FilesystemModelAssetBundleLoader.ts'

registerModelAssetBundleLoader(new FilesystemModelAssetBundleLoader(modelAssetBundleUrls))
