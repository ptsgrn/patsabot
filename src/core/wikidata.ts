import WBEdit, { type WikibaseEditAPI } from "wikibase-edit";
import { wdk } from "wikibase-sdk/wikidata.org";
import { ServiceBase } from "./base";

export interface WikibaseServiceOptions {
  userAgent: string;
  credentials: {
    oauth: {
      consumer_key: string;
      consumer_secret: string;
      token: string;
      token_secret: string;
    };
  };
}

type WikibaseSDKAPI = typeof wdk;

export class WikidataService {
  private options: WikibaseServiceOptions;
  private wbSdk: WikibaseSDKAPI;
  private wbEdit: WikibaseEditAPI;

  constructor(options: WikibaseServiceOptions) {
    this.options = options;
    this.wbSdk = wdk;
    this.wbEdit = WBEdit({
      instance: "https://www.wikidata.org",
      userAgent: options.userAgent,
      credentials: options.credentials,
    });
  }

  get read() {
    return this.wbSdk;
  }

  get edit() {
    return this.wbEdit;
  }
}
