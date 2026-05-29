import {registerModelAssetBundleLoader} from '../data.ts'
import {modelAssetBundleUrls} from '../modelAssetBundleUrls.ts'
import {FetchModelAssetBundleLoader} from '../modelAssets/FetchModelAssetBundleLoader.ts'

registerModelAssetBundleLoader(new FetchModelAssetBundleLoader(modelAssetBundleUrls))
