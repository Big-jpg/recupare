// lib/azure-content-understanding.ts

export interface CUField {
    content?: string;
    valueNumber?: number;
    valueString?: string;
}

export interface CUFields {
    [key: string]: CUField | undefined;
}

export interface CUContent {
    fields?: CUFields;
}

export interface CUResult {
    status?: string;
    result?: {
        contents?: CUContent[];
        documents?: CUContent[];
    };
    contents?: CUContent[];
    documents?: CUContent[];
    fields?: CUFields;
}

type HeadersMap = Record<string, string>;

export async function analyzeWithContentUnderstanding(
    fileUrlOrBuffer: string | Buffer
): Promise<CUResult> {
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const subscriptionKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
    const analyzerId = "custom-tax-invoice-advanced";
    const apiVersion = "2024-07-31-preview";

    if (!endpoint || !subscriptionKey) {
        throw new Error("Missing Azure Document Intelligence configuration");
    }

    // 1. Submit for analysis
    let body: BodyInit;
    let headers: HeadersMap;

    if (typeof fileUrlOrBuffer === "string") {
        body = JSON.stringify({ urlSource: fileUrlOrBuffer });
        headers = {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": subscriptionKey,
            "x-ms-useragent": "cu-sample-node",
        };
    } else if (Buffer.isBuffer(fileUrlOrBuffer)) {
        body = new Uint8Array(fileUrlOrBuffer);
        headers = {
            "Content-Type": "application/octet-stream",
            "Ocp-Apim-Subscription-Key": subscriptionKey,
            "x-ms-useragent": "cu-sample-node",
        };
    } else {
        throw new Error("fileUrlOrBuffer must be a URL or a Buffer");
    }

    const analyzeUrl = `${endpoint}/contentunderstanding/analyzers/${analyzerId}:analyze?api-version=${apiVersion}`;
    const resp = await fetch(analyzeUrl, {
        method: "POST",
        headers,
        body,
    });

    if (!resp.ok) throw new Error(`[CU] Analyze failed: ${await resp.text()}`);
    const operationLocation = resp.headers.get("operation-location");
    if (!operationLocation) throw new Error("[CU] No operation-location header received");

    // 2. Poll for result
    let status: string = "notStarted";
    let result: CUResult | null = null;
    const pollHeaders: HeadersMap = {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "application/json",
    };
    let attempts = 0;
    while (status !== "succeeded" && status !== "failed" && attempts < 60) {
        await new Promise((res) => setTimeout(res, 2000));
        const pollResp = await fetch(operationLocation, { headers: pollHeaders });
        result = (await pollResp.json()) as CUResult;
        status = (result.status || "").toLowerCase();
        attempts++;
    }
    if (status !== "succeeded") throw new Error(`[CU] Operation failed: ${JSON.stringify(result)}`);
    return result!;
}

