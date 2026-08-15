import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

export type FormValues<TSchema extends z.ZodType> = z.infer<TSchema>;

export { zodResolver };
