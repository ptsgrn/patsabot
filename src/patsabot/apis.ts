import bot from './bot.js';
import log from './logger.js';

/**
 * Get page transcluding.
 * @param {string} page Pages to get transcludings.
 * @param {string} [options.tiprop] Which properties to get
 * @param {string} [options.tinamespace] Only include pages in these namespaces.
 * @param {'redirect' | '!redirect'} [options.tishow] Show only items that meet these criteria.
 * @param {('max' | 'number')} [options.tilimit="max"] How may to return.
 * @returns {Promise<string[]> | Promise<[]>} array of page that the page has been transcluded in.
 */
export async function getPageTranscluding(
  page: string,
  options = {}
): Promise<string[] | []> {
  if (typeof page !== 'string' || page.split('').includes('|')) {
    log.log(
      'apierror',
      'page must be a string and not contain pipe character.',
      { from: 'internal:bot#getPageTranscluding', id: 'invalid-page' }
    );
    return [];
  }
  let results = [];
  try {
    for await (let json of bot.continuedQueryGen({
      action: 'query',
      prop: 'transcludedin',
      titles: page,
      tilimit: 'max',
      ...options,
      formatversion: '2',
    })) {
      results = results.concat(
        json.query.pages[0].transcludedin.map((page) => page.title)
      );
    }
  } catch (err) {
    log.log('apierror', err, {
      from: 'internal:bot#getPageTranscluding',
      id: 'query-error',
    });
  }
  log.log('debug', `getPageTranscluding: ${results.length} results.`, {
    from: 'internal:bot#getPageTranscluding',
    id: 'query-success',
  });
  return results;
}

/**
 * Get pages in category.
 * @param {string} category Category to get pages.
 * @param {string} [options.cmtype] Only include pages in these types.
 * @param {string} [options.cmlimit="max"] How may to return.
 * @returns {Promise<string[]> | Promise<[]>} array of page that the category has.
 */
export async function getCategoryMembers(
  category: string,
  options = {}
): Promise<string[] | []> {
  if (typeof category !== 'string' || category.split('').includes('|')) {
    log.log(
      'apierror',
      'category must be a string and not contain pipe character.',
      { from: 'internal:bot#getCategoryMembers', id: 'invalid-category' }
    );
    return [];
  }
  let results = [];
  try {
    for await (let json of bot.continuedQueryGen({
      action: 'query',
      list: 'categorymembers',
      cmlimit: 'max',
      cmtitle: category,
      ...options,
      formatversion: '2',
    })) {
      results = results.concat(
        json.query.categorymembers.map((page) => page.title)
      );
    }
  } catch (err) {
    log.log('apierror', err, {
      from: 'internal:bot#getCategoryMembers',
      id: 'query-error',
    });
  }
  log.log('debug', `getCategoryMembers: ${results.length} results.`, {
    from: 'internal:bot#getCategoryMembers',
    id: 'query-success',
  });
  return results;
}

/**
 * get list of object from list
 * @param {string} list used in `action=query&list=${list}`
 * @param {any} options additional options to pass to `action=query&list=${list}`
 * @returns list of objects, ripped of json.query.${list} parts.
 */
export async function getApiQueryLists(list: string, options: any = {}) {
  if (typeof list !== 'string' || list.split('').includes('|')) {
    log.log(
      'apierror',
      'list must be a string and not contain pipe character.',
      { from: 'internal:bot#getApiQueryLists', id: 'invalid-list' }
    );
    return [];
  }
  let results = [];
  try {
    for await (let json of bot.continuedQueryGen({
      action: 'query',
      list,
      ...options,
      formatversion: '2',
    })) {
      results = results.concat(json.query[list]);
    }
  } catch (err) {
    log.log('apierror', err, {
      from: 'internal:bot#getApiQueryLists',
      id: 'query-error',
    });
  }
  log.log('debug', `getApiQueryLists: ${results.length} results.`, {
    from: 'internal:bot#getApiQueryLists',
    id: 'query-success',
  });
  return results;
}
