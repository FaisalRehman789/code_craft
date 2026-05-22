import { NextResponse } from "next/server";

const JDOODLE_API_URL =
  process.env.JDOODLE_API_URL || "https://api.jdoodle.com/v1/execute";

const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;

const MAX_CODE_LENGTH = 20_000;

type JDoodleResponse = {
  output?: string;
  error?: string | null;
  statusCode?: number;
  memory?: string;
  cpuTime?: string;
  compilationStatus?: string | null;
  isExecutionSuccess?: boolean;
  isCompiled?: boolean;
};

export async function POST(req: Request) {
  try {
    if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
      return NextResponse.json(
        {
          error:
            "Missing JDoodle credentials. Add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to your environment variables.",
        },
        { status: 500 },
      );
    }

    const body = await req.json();

    const code = typeof body.code === "string" ? body.code : "";
    const language = typeof body.language === "string" ? body.language : "";
    const versionIndex =
      typeof body.versionIndex === "string" ? body.versionIndex : "0";
    const stdin = typeof body.stdin === "string" ? body.stdin : "";

    if (!code.trim()) {
      return NextResponse.json({ error: "Code is required." }, { status: 400 });
    }

    if (!language) {
      return NextResponse.json(
        { error: "Language is required." },
        { status: 400 },
      );
    }

    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        {
          error: `Code is too large. Max ${MAX_CODE_LENGTH} characters allowed.`,
        },
        { status: 400 },
      );
    }

    const response = await fetch(JDOODLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: JDOODLE_CLIENT_ID,
        clientSecret: JDOODLE_CLIENT_SECRET,
        script: code,
        stdin,
        language,
        versionIndex,
      }),
    });

    const data = (await response.json()) as JDoodleResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error ||
            data?.output ||
            `JDoodle request failed with status ${response.status}.`,
        },
        { status: response.status },
      );
    }

    const apiError = data.error || data.compilationStatus || null;
    const output = data.output || "";

    const failedByStatusCode =
      typeof data.statusCode === "number" && data.statusCode !== 200;

    const failedByFlag =
      data.isExecutionSuccess === false || data.isCompiled === false;

    if (apiError || failedByStatusCode || failedByFlag) {
      return NextResponse.json({
        output: "",
        error: apiError || output || "Code execution failed.",
        statusCode: data.statusCode,
        memory: data.memory,
        cpuTime: data.cpuTime,
      });
    }

    return NextResponse.json({
      output,
      error: null,
      statusCode: data.statusCode,
      memory: data.memory,
      cpuTime: data.cpuTime,
    });
  } catch (error) {
    console.error("JDoodle execution error:", error);

    return NextResponse.json(
      { error: "Internal server error while running code." },
      { status: 500 },
    );
  }
}
