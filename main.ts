import { serve } from "https://deno.land/std@0.188.0/http/server.ts";

import app from "./src/app.tsx";

serve(app.fetch);
