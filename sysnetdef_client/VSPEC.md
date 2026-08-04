# 1. PROJECT TECHNOLOGIES - INSTALLED LIBS
---
    mkdir sysnetdef_client && cd sysnetdef_client
    npm init -y
    npm install react@19.2.0 
    npm install react-dom@19.2.0 
    npm install react-router-dom@7.13.2 
    npm install zustand@5.0.11 
    npm install axios@1.13.6 
    npm install socket.io-client@4.8.3 
    npm install antd@6.3.1 
    npm install @ant-design/icons@6.1.0 
    npm install @fortawesome/fontawesome-svg-core@7.2.0 
    npm install @fortawesome/free-solid-svg-icons@7.2.0 
    npm install @fortawesome/react-fontawesome@3.3.0 
    npm install echarts@6.0.0 
    npm install echarts-for-react@3.0.6 
    npm install xlsx@0.18.5 
    npm install jszip@3.10.1 
    npm install html2canvas@1.4.1 
    npm install jspdf@4.2.1 
    npm install file-saver@2.0.5 
---
# 2. DIRECTORY TREE
```
src/
├── application/                        
│   ├── layout/                         # Base layout components
│   ├── loader/                         # Auth loaders for access control prior to rendering
│   └── pages/                          # Route views composed from features, rendered inside Main Layout
├── assets/                             # Static resources (images, icons)
├── config/                             # API and WebSocket network configuration
├── features/                           # Domain-driven modules containing isolated components, logic, and state
│   ├── modules/                        # Feature-specific sub-modules grouped by business domains
│   │   ├── antiddos_dashboard/     
│   │   │   ├── components/             # UI components and charts for Anti-DDoS monitoring
│   │   │   ├── services/               # API services for Anti-DDoS traffic & mitigation
│   │   │   └── store/                  # State management for Anti-DDoS alerts & metrics
│   │   ├── auth/
│   │   │   ├── LoginForm_page/         # Login interface and form validation logic
│   │   │   └── services/               # Authentication APIs 
│   │   ├── idps/
│   │   │   ├── analyze_page/           # Traffic analysis & threat detection view
│   │   │   ├── dashboard_page/         
│   │   │   │   ├── components/         # IDPS dashboard widgets, charts & statistics
│   │   │   │   └── store/              # State management for IDPS threat events
│   │   │   ├── rulesManagement_page/   # IDPS rules configuration & management interface
│   │   │   └── services/               # APIs and route loaders for IDPS rules & threat data
│   │   ├── ipsec/
│   │   │   ├── dashboard/
│   │   │   │   ├── components/         # VPN tunnel status widgets & active connections
│   │   │   │   └── store/              # State management for IPSec connections
│   │   │   ├── listProfiles/
│   │   │   │   └── components/         # UI tables & cards for IPsec policy profiles
│   │   │   ├── services/               # APIs and route loaders for IPSec configurations & tunnel controls
│   │   │   └── setting/
│   │   │       └── components/         # Configuration forms for advanced IPsec settings
│   │   └── management/
│   │       ├── logs_page/              # System audit & security event log viewer
│   │       └── services/               # APIs for fetching & exporting logs
│   └── types/                          # Data models and Type definitions for feature modules
├── hooks/                              # Custom hooks for viewport-based typography scale
├── system/                             
|   ├──providers                        # Global context providers for notifications and real-time WebSocket data
|   ├──routes                           # Route definitions and routing configurations
|   └──stores                           # Tracks global system lockouts and active backend processes
├── theme/                              # UI theme customization, color palettes, and global styles
└── utils/                              # Common utility functions and general-purpose helper methods

```
# 3. PROJECT LAYERS 
### Layer 1: VIEW ROUTING & LAYOUT SHELL
---
    1. LAYOUT (Define the overall interface framework for the entire system, including fixed components: header, sidebar, page title, handle notification, main (Dynamic content display frame))

    2. PAGE (This layer is responsible for initializing the overall page layout and aggregating the necessary components from the domain feature component layer to create a complete page.)
---
### Layer 2: DOMAIN FEATURE COMPONENTS
---
    1. AUTH (This layer is responsible for aggregating functional modules, the login form, and the login handling API for the system.)

    2. ANTI-DDOS (This layer acts as an aggregator for the Anti-DDoS system's functional modules, managing UI components, data handling API configurations, and the data store for the dashboard.)

    3. IPSEC (This layer is responsible for managing IPSec components, the data store, and processing API configurations for IPSec.)

    4. IDPS (This layer acts as an aggregator for the IDPS system's functional modules, managing specialized components like rules management tables, traffic analysis grids, data store handlers, and intrusion detection dashboards.)

    5. MANAGEMENT (This layer aggregates general system administration modules, primarily responsible for organizing log tracking components—DDoS, IDPS, IPSec, and Device logs—and managing system-wide export controls.)

---
### LAYER 3: STATE MANAGEMENT
---
    1. FEATURE STORE (Localized Zustand stores implemented inside each module to cache real-time traffic logs, manage contextual component behaviors, and buffer live WebSocket streaming data.)

    2. SYSTEM STORE (The application-wide Zustand stores are responsible for handling global runtime states, related to locking the application or putting it into a waiting state.)
---
### LAYER 4: MIDDLEWARE & CUSTOM HOOKS
---
    1. ROUTE LOADERS (Asynchronous interceptors that execute before views mount, performing security token validation checks and pre-fetching heavy collection lists from the backend server to avoid layout flickering.)

    2. CUSTOM HOOKS (Client-side UI logic tools help calculate adaptive font settings based on browser window resolution.)
---
### LAYER 5: DATA ACCESS SERVICES
---
    1. API CLIENTS (Encapsulated module-specific Axios endpoint calls that format raw component input actions into backend REST API data requests and mutations.)

    2. DOMAIN TYPES (Centralized TypeScript contract models and object definitions that guarantee strict data structure consistency from server responses down to layout tables.)
---
### LAYER 6: CORE INFRASTRUCTURE & UTILS
---
    1. NETWORK CONFIG (The base setup for all communication clients, hosting the primary Axios client interceptors, environment variable configurations, and base WebSocket setups.)

    2. SYSTEM PROVIDERS (Continuous structural wrappers that run in the background to instantiate and distribute global event stream networks, WebSockets, directly to target features.)

    3. THEME (A centralized design framework configuration file used to custom-tailor component styles and override base Ant Design layout colors.)

    4. UTILITIES (Decoupled helper functions entirely separate from UI logic, responsible for bit-rate/bps measurement calculations, binary log processing, and compiled zipped report downloads.)
---
# 4. DEVELOPMENT GUIDELINES & CONVENTIONS
---

## 4.1 API LAYER IMPLEMENTATION STANDARD
All HTTP REST API communication services must strictly adhere to the following architectural patterns to ensure codebase consistency and seamless integration with core system modules:

* **Use Shared Axios Instance Only:** Never initialize a new Axios instance. Developers must strictly utilize the shared `axiosClient` imported from `@/config/api/axiosClient`. This instance comes pre-configured with `baseURL: '/api'` and global authorization interceptors.
* **Zero Manual Token Handling:** The network infrastructure automatically injects the `access_token` from local storage into the request headers. Do not pass tokens as functional parameters in your API declarations.
* **Mandatory Logger Integration:** To support real-time process monitoring and debugging, every single API method inside `features/modules/*` must execute within a `try-catch` block and stream status outputs using the centralized `logger` utility (`@/utils/logger.utils`).

###  Scoped API Boilerplate Template:
When creating a new `.api.ts` file for a feature module, implement the exact structural blueprint below:

```typescript
import axiosClient from "@/config/api/axiosClient";
import type { ApiResponse } from "@/features/types";
import { logger } from "@/utils/logger.utils";
import type { YourPayloadType, YourResponseType } from "../types/your-module.type";

export const yourDomainApi = {
    // 1. QUERY METHOD (Fetching remote data collections)
    getDataList: async (params?: any): Promise<ApiResponse<YourResponseType>> => {
        try {            
            const response: any = await axiosClient.get("/your-endpoint/", { params });
            return response.data || response; // Synchronized with AxiosClient response unwrapping
        } catch (error: any) {
            throw error.response?.data || { message: "Lỗi kết nối máy chủ" };
        }
    },

    // 2. MUTATION METHOD (POST / PUT / PATCH / DELETE commands)
    createData: async (payload: YourPayloadType): Promise<ApiResponse<any>> => {
        try {           
            const response: any = await axiosClient.post("/your-endpoint/", payload);
            return response.data || response;
        } catch (error: any) {
            throw error.response?.data || { message: "Lỗi hệ thống khi xử lý dữ liệu" };
        }
    }
};
```

## 4.2. ROUTE LOADER DESIGN PATTERN
To eliminate layout flickering, cumulative layout shifts (CLS), or rendering unpopulated UI structures while awaiting asynchronous server data, the system utilizes React Router Loaders. 

### Architectural Purpose & Core Use Cases
Route Loaders act as pre-render data lifecycle interceptors. They halt the view transition, ensuring that critical dependencies are fully resolved before the client interface mounts onto the DOM. Loaders are strictly mandatory for two operational scenarios:
1. **Pre-Fetching High-Priority Data:** Essential for data-driven dashboards or management grids (e.g., IDPS rules, log tables) that require immediate data population upon mounting to avoid blank layout frames.
2. **Pre-Rendering Structural & Security Validations:** Critical for compliance-heavy configurations (e.g., IPsec profile setups) that must verify infrastructure criteria—such as checking for existing system certificates—before exposing the user interface.

### Structural Placement Rules (Multi-Tier Location Pattern)
Depending on the scope, impact, and access rules of the target route, loaders are deployed in one of two specific layers within the codebase:

* **Global & Core Protected Boundaries (`src/application/loader/`):** Reserved for top-level, high-priority, or system-wide route interceptors. This layer hosts global authentication checks, token verifications, or heavy initialization scripts that manage gateway access control before rendering core layout shells.
* **Feature-Specific Sub-Modules (`src/features/modules/[feature_name]/services/loader/`):**
  Used for granular, isolated micro-features and small target sub-pages. Scoping these loaders directly inside their respective feature domains maintains the **Co-location Principle**, keeping feature logic decoupled from the global core and ensuring that specific data models (such as an IPsec profile validator) remain self-contained.

### Universal Implementation Standards
Regardless of internal complexity or where the loader is located, every loader implementation must adhere to these three rules:
* **Decoupled Data Pre-fetching:** All asynchronous server communication must resolve outside the React rendering loop. The loader must fetch the raw data and forward clean payload models directly to the UI components via the `useLoaderData()` hook.
* **Fail-Safe Response Control:** If an API call fails or experiences a network dropout, the loader must explicitly catch the error, interrupt the routing process, and throw an error `Response` object equipped with standard HTTP status codes (e.g., `{ status: 500 }`). This immediately triggers the global `ErrorBoundary` instead of crashing the UI.

## 4.3. REAL-TIME SOCKET SUBSCRIPTION & DATA PIPELINE
To achieve high-fidelity dashboards rendering dense packet streams (Anti-DDoS telemetry, IPsec tunnel bandwidth, and IDPS network log graphs) without crashing the browser DOM or inducing UI stutter, the application executes a decoupled, multi-tier data pipeline:

```text
                        ┌──► [Zustand Stores] ────► [ECharts / History Views] (Sliding Window)
                        │     (Historical Analytics)
[Socket Stream] ──► [Refs] ──(1s Throttle)
 (High-Freq)       (Buffer)     │
                        └──► [Provider States] ──► [KPI Blocks / Real-time UI] (Instant Snapshot)
                              (Direct Values)
```
### 4.3.1. Centralized Socket Initialization & Multiplexing
File Location: `src/config/socket/socket.ts`

The connection management of the Socket.io lifecycle is tightly consolidated under a single, unified `Manager` instance. This design choice optimizes physical hardware hardware resources and shares a single underlying TCP socket layer via multi-namespace connection multiplexing:

* **Isolated Network Contexts:** Dividing communication streams into isolated structural namespaces (/, /ipsec, /idps) completely sequesters continuous network traffic payloads. Heavy Anti-DDoS broadcast spikes or granular IDPS logs will never bleed across domains or choke unrelated bandwidth resources.

* **Driven by Auth Lifecycle:** All namespace instances are configured with autoConnect: false. Socket connections are strictly initiated only after the client application successfully completes its user security token validation checks.

### 4.3.2. Infrastructure Connection & Ingestion Boundary
File Location: `src/system/providers/SocketProvider.tsx`

The SocketProvider acts as the master orchestrator, wrapping the initialization, subscription, and teardown lifecycles of all core sub-sockets, while enforcing a strict "Data Ingestion Boundary" that decouples volatile network I/O speed from React's functional layout engine.

* **Centralized Connection & Cleanup Lifecycle:** When the application pulls a valid access_token from local storage or processes a login mutation, the provider's connectSocket(token) handler appends the signature to the .auth properties and connects the sockets simultaneously. Upon logout or unmounting, listeners are scrubbed clean via .removeAllListeners() and closed via .disconnect(), permanently mitigating memory leak vectors.

* **The High-Frequency Render Trap:** Real-time packet telemetry pushed from backend engines frequently arrives at millisecond intervals. Piping these raw, unthrottled payloads straight into standard reactive state triggers (useState, reactive store set mutators) will crash the browser main-thread, generating layout bottlenecks and freezing the layout.

* **The Reference Buffering Requirement:** To disrupt this performance degradation, event listeners (.on('traffic'), .on('idps_traffic_stats'), etc.) must never modify component state directly. Instead, incoming values are quietly written to non-reactive mutable data slots: useRef containers (latestIdpsTrafficRef.current = data). This safely logs metric vectors into memory with zero component rendering side effects.

### 4.3.3. Deterministic Throttling & Zustand Store Injection
File Location: `src/system/providers/SocketProvider.tsx` bridging to `src/features/modules/[feature_name]/store/[feature]Store.ts`

To bridge buffered reference datasets out of the `useRef` memory pools and into the application's global state system, the infrastructure implements a **Deterministic Throttling process bound to a fixed 1000ms (1-second) window**.At this heartbeat pulse, data branches into two separate sinks based on its operational purpose:

* **Channel A: Historical Analytics Sink (Zustand Store Route):** Telemetry that maps to time-series charts or requires accumulated logging windows is discharged into dedicated Zustand store actions (e.g., useIdpsStore.getState().updateIdpsData(...)).

    * **Sliding Window Pattern:** The receiving store is architecturally obligated to maintain a strict First-In-First-Out (FIFO) timeline pool (e.g., capped at 300 points for charts or 100 entries for packet tables). Older historical data is shifted off the array (.slice(1)) as new data is appended, stabilizing client-side RAM overhead.

* **Channel B: Instant Snapshot Sink (Direct Provider State Route):** Volatile states that only represent real-time standalone metrics (e.g., interface status logs, current single-second traffic rates, live raw packet grids) bypass global store persistence completely. They are discharged straight into local context useState structures inside the provider to reflect immediate changes without structural caching overhead.

* **The Cache Clearing Obligation:** Immediately upon executing both data branch dispatches, the infrastructure provider resets all reference containers (ref.current = null) to guarantee data freshness for the next 1-second accumulation period.

## 4.4. ASYNCHRONOUS NOTIFICATION & SYSTEM LIFECYCLE FEEDBACK PIPELINE
To reconcile long-running hardware configuration tasks (such as firmware-level compilation of IDPS rule catalogs or cryptographic deployment of IPsec policies) with client-side experiences, the application orchestrates a cross-layer event-driven lifecycle loop:

```text
[HTTP REST Request] ──► [Axios Interceptor] ──(202 Accepted)──► useLockStore (isLocked: true)
                                                                       │ (Triggers Info Banner)
                                                                       ▼
[UI Liberated & Synced] ◄── NotificationHandler ◄── [Custom Events] ◄── SocketProvider ◄── [WS sys_notify]
```

### 4.4.1. Architecture Mapping & Core File Positions
The operational pipeline is decoupled across four interconnected boundaries to enforce structural durability and state alignment:

* **The Network Interceptor Sink (`src/config/api/axiosClient.ts`):** Automatically traps response signatures. If an advanced transaction returns an asynchronous 202 Accepted configuration command or triggers a transient hardware busy state (503 Service Unavailable), this module captures the metadata, updates the absolute hardware lock matrix, and dispatches uniform lifecycle notifications via native Event Emitters.

* **The Background Stream Dispatcher (`src/system/providers/SocketProvider.tsx`):** Maintains persistent real-time monitoring circuits over dedicated control namespaces (/system_notification). When the underlying network operating system successfully seals a processing task, this layer intercepts the completion broadcast and propagates the liberation event down to layout handlers.

* **The Core State Shell (`src/system/stores/useLockStore.ts`):** Houses the reactive global variables (isLocked, currentAction). This state acts as an invariant gatekeeper, commanding the Axios request network to explicitly abort raw client mutation writes (POST, PUT, DELETE) mid-transit via axios.Cancel vectors to eliminate race conditions while compilation parameters execute in the background.

* **The Unified Presentation Coordinator (`src/application/layout/notificationHandler/notificationHandler.FC`):** Mounted permanently within the top-level structural layout framework (📍 src/application/layout/main/main.tsx). It intercepts abstract client-side custom events, manages interactive notification panels, handles multi-session collision states, and maps contextual routing links to help users view deployed data tables.

### 4.4.2. Universal Operational Flows & Event Lifecycles
**Flow A: The Master Command Execution Loop (Initiator Routing)**
1. A configuration change request is issued from a sub-page view inside the main layout `<Outlet />`.

2. The network client fires the HTTP command, receiving an asynchronous `202 Accepted` signature packed with an operational identifier (e.g., `currentAction: "IDPS_RULES_UPDATE"`).

3. The Axios response interceptor intercepts the token, engaging the lockout matrix via `setLocked(true, rawData.currentAction)` and committing an internal signature token to cache memory via sessionStorage.setItem('is_initiator', 'true').

4. The interceptor immediately dispatches a global native event contract `window.dispatchEvent(new CustomEvent("API_NOTIFY", { detail: { status: 202, ... } }))`.

5. The tracking controller component `(NotificationHandler)` intercepts the event and targets an exclusive system key parameter: `ASYNC_PROCESS_KEY = 'async_notification_key'`. It initializes a static alert banner `(notification.info)` configured with `duration: 0` to hang indefinitely on screen while blocking mutations.

6. Once the background firmware completes compiling the data structures, the backend fires a `"sys_notify"` completion event down the WebSocket pipeline.

7. `SocketProvider.tsx` catches the broadcast, releases the application blockage (setLocked(false)), and triggers the final release contract: `window.dispatchEvent(new CustomEvent('SYS_NOTIFY_RECEIVED', { detail: payload }))`.

8. `NotificationHandler` captures the event, inspects the storage key (is_initiator === 'true'), immediately strips the hanging banner via `notification.destroy(ASYNC_PROCESS_KEY)`, and displays a comprehensive `modal.success` component containing explicit interactive redirect workflows (`onOk: () => navigate(config.route)`).

**Flow B: The Collaborative Multi-User Concurrency Loop (Passive Client Routing)**
1. When User A executes a modification that locks the hardware, User B's independent client interface remains unblocked until they fire an asynchronous HTTP mutation write command.

2. If User B dispatches a write event while User A's compilation task runs in the background, the network interceptor evaluates the global condition state. Recognizing `isLocked === true`, it flags a structural collision, drops the outbound connection via `throw new axios.Cancel()`, and broadcasts a local execution event.

3. `NotificationHandler` traps the cancelled request, verifying that the current session is not the originator (`is_initiator` is missing). It renders an alert payload notifying the user that the security gateway is executing tasks commanded by another session.

4. Alternatively, if User B is simply observing a monitoring grid while User A's background rules compile successfully, User B's local namespace receives the identical `"sys_notify"` socket release payload.

5. `SocketProvider.tsx` dispatches the synchronized completion payload down the window thread.

6. `NotificationHandler` intercepts the record on User B's screen. Because `is_initiator` evaluates to false, it swaps the passive data fields inside `ASYNC_PROCESS_KEY` or deploys a temporary auto-dismissing toast (`notification.success` with `duration: 4.5`). This toast injects an integrated action link to explicitly alert User B: "Another user just updated: IDPS Rules. [View Changes]".

```text
[User A: Mutates Rules] ──► (Axios 202) ──► Sets useLockStore(isLocked: true)
                                                 │
                                                 ├──► [User B: Attempts Write] ──► (Axios Cancelled)
                                                 │
[Hardware Compiles] ────► (WS Broadcast) ────────┴──► [All Users: Released & Synced]
```
# 5. DEV ONLY FEATURES
---
    LOGGER (A centralized utility that prints system processes and debugging logs to the console during development, while completely suppressing outputs in production to prevent data leakage.)
---

# 6. BUILD INSTRUCTION
`cd workspace/run` -> execute file build.bat -> replace dist dir to production src -> run `sudo systemctl restart nginx`