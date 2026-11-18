/// <reference types="node" />

import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { RoutedSite } from "./App";

export { indexableRoutes, renderableRoutes, routeMeta, siteOrigin, socialImage } from "./routeMeta";

export function renderPage(path: string) {
  return new Promise<string>((resolve, reject) => {
    const destination = new PassThrough();
    const chunks: Buffer[] = [];
    destination.on("data", (chunk: Buffer) => chunks.push(chunk));
    destination.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    destination.on("error", reject);

    const stream = renderToPipeableStream(<StaticRouter location={path}><RoutedSite /></StaticRouter>, {
      onAllReady() { stream.pipe(destination); },
      onError: reject,
    });
  });
}
