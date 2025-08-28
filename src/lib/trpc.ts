import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../../lib/routers/index.js";

export const { TRPCProvider, useTRPC, useTRPCClient } =
	createTRPCContext<AppRouter>();

export type { AppRouter } from "../../lib/routers/index.js";
