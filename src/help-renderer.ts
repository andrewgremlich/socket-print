import "@/global-style.css";
import "@/help-content.css";

import { registerServiceWorker } from "@/registerServiceWorker";
import { initializeTheme } from "@/web-components/Settings";

initializeTheme();
registerServiceWorker();
