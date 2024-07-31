import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { agenciesFunctionsMap } from "../agencies";

export async function agencyFunction(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const agencyName = request.query.get("name") || (await request.text());

  if (!agencyName) {
    return {
      status: 400,
      body: JSON.stringify({ error: "Agency name is not specified" }),
    };
  }

  if (!agenciesFunctionsMap.hasOwnProperty(agencyName)) {
    return {
      status: 404,
      body: JSON.stringify({ message: "Agency with that name not found" }),
    };
  }

  try {
    context.log("Http function is processing request for " + agencyName);

    const emit = {
      message: (_message: string) => {
        // context.log({
        //   agencyName,
        //   message,
        //   type: "message",
        // });
      },
      error: (_message: string) => {
        // context.error({
        //   agencyName,
        //   message,
        //   type: "error",
        // });
      },
      done: (_message: string) => {
        // context.log({
        //   agencyName,
        //   message,
        //   type: "exit",
        // });
      },
    };

    const result = await agenciesFunctionsMap[agencyName](emit);

    return { body: JSON.stringify(result) };
  } catch (error) {
    return { body: JSON.stringify({ error: error.message }) };
  }
}

app.http("agencyFunction", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: agencyFunction,
});
