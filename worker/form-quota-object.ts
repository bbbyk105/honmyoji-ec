import { DurableObject } from "cloudflare:workers";

import { quotaDay, takeQuota, type FormQuotaResult } from "../lib/form-quota";

/**
 * 公開フォームの一日の上限を数える Durable Object（lib/form-quota.ts）。インスタンスは一つ
 * （`idFromName("public-forms")`）。Durable Object の storage は一度に一つの要求しか通さないので、
 * 読んで足して書く間に別の送信が割り込まない。
 */
export class FormQuota extends DurableObject {
  async take(ip: string): Promise<FormQuotaResult> {
    return takeQuota(this.ctx.storage, ip, quotaDay());
  }
}
