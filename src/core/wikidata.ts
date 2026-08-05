import WBEdit, { type WikibaseEditAPI } from "wikibase-edit";
import { wdk } from "wikibase-sdk/wikidata.org";

export interface WikibaseServiceOptions {
  userAgent: string;
  /** Wikibase instance to write to. Defaults to Wikidata. */
  instance?: string;
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
  private wbSdk: WikibaseSDKAPI;
  private wbEdit: WikibaseEditAPI;

  constructor(options: WikibaseServiceOptions) {
    this.wbSdk = wdk;
    this.wbEdit = WBEdit({
      instance: (options.instance ?? "https://www.wikidata.org") as `http${string}`,
      userAgent: options.userAgent,
      credentials: options.credentials,
    });
  }

  /** Unauthenticated read API (wikibase-sdk). */
  get read() {
    return this.wbSdk;
  }

  /** Authenticated write API (wikibase-edit). */
  get edit() {
    return this.wbEdit;
  }
}
