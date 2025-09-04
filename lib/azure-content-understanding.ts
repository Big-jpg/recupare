// lib/azure-content-understanding.ts

type HeadersMap = Record<string, string>;

export interface CUField {
  content?: string;
  valueNumber?: number;
  [key: string]: unknown;
}

export interface CUFields {
  [key: string]: CUField | undefined;
}

export interface CUContent {
  fields?: CUFields;
  tables?: unknown[];
  [key: string]: unknown;
}

export interface CUResult {
  status?: string;
  result?: { contents?: CUContent[] };
  contents?: CUContent[];
  fields?: CUFields;
  [key: string]: unknown;
}

// Use Next/Node global fetch; do NOT import node-fetch
// If you must force Node runtime in a route handler: export const runtime = "nodejs";

const endpoint = process.env.AZURE_CU_ENDPOINT!;
const apiVersion = process.env.AZURE_CU_API_VERSION || "2024-07-31-preview";
const analyzerId = process.env.AZURE_CU_ANALYZER_ID || "custom-tax-invoice-advanced";
const subscriptionKey = process.env.AZURE_CU_KEY!;


export async function analyzeWithContentUnderstanding(
  fileUrlOrBuffer: string | Buffer
): Promise<CUResult> {
  if (!endpoint || !subscriptionKey) {
    throw new Error("Missing Azure CU configuration (endpoint/key).");
  }

  let body: BodyInit;
  let headers: HeadersMap;

  if (typeof fileUrlOrBuffer === "string" &&
      /^(https?:)?\/\//i.test(fileUrlOrBuffer)) {
    // JSON URL submission — NOTE: CU requires `urlSource`
    body = JSON.stringify({ urlSource: fileUrlOrBuffer });
    headers = {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "x-ms-useragent": "cu-sample-node",
    };
  } else if (Buffer.isBuffer(fileUrlOrBuffer)) {
    // Binary submission — Buffer works on Node; convert to ArrayBuffer for Edge safety
    const ab = bufferToArrayBuffer(fileUrlOrBuffer);
    body = ab;
    headers = {
      "Content-Type": "application/octet-stream",
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "x-ms-useragent": "cu-sample-node",
    };
  } else {
    throw new Error("fileUrlOrBuffer must be an https URL or a Buffer.");
  }

  const analyzeUrl = `${endpoint}/contentunderstanding/analyzers/${analyzerId}:analyze?api-version=${apiVersion}`;
  const resp = await fetch(analyzeUrl, { method: "POST", headers, body });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`[CU] Analyze failed (${resp.status}): ${text || resp.statusText}`);
  }

  // Header case varies; Fetch normalizes to lowercase keys
  const operationLocation = resp.headers.get("operation-location") || resp.headers.get("Operation-Location");
  if (!operationLocation) {
    throw new Error("[CU] No operation-location header received.");
  }

  // Poll
  let status = "notStarted";
  let result: CUResult | null = null;
  const pollHeaders: HeadersMap = {
    "Ocp-Apim-Subscription-Key": subscriptionKey,
    "Content-Type": "application/json",
  };

  for (let attempts = 0; attempts < 60; attempts++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollResp = await fetch(operationLocation, { headers: pollHeaders });
    if (!pollResp.ok) {
      const text = await pollResp.text().catch(() => "");
      throw new Error(`[CU] Poll failed (${pollResp.status}): ${text || pollResp.statusText}`);
    }
    result = (await pollResp.json()) as CUResult;
    status = (result.status || "").toLowerCase();
    if (status === "succeeded" || status === "failed") break;
  }

  if (status !== "succeeded") {
    throw new Error(`[CU] Operation did not succeed: ${JSON.stringify(result)}`);
  }

  return result!;
}
function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buffer.byteLength);
  const view = new Uint8Array(ab);
  view.set(buffer);
  return ab;
}

