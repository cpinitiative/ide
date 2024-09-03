# Datadog and the USACO Guide IDE

[Datadog](https://www.datadoghq.com/) has generously provided its infrastructure monitoring capabilities to the USACO Guide IDE as part of its OSS program.

The USACO Guide IDE uses Datadog to monitor our YJS server, which powers our realtime collaborative text editor, as well as the code execution engine on AWS Lambda.

## YJS Server

Our [YJS Server](https://github.com/cpinitiative/ide-yjs) is a simple Node.js server running on an Azure VM instance. We have had ongoing stability issues associated with the YJS server as sudden spikes in traffic can easily overwhelm the server, bringing the entire IDE down. We were able to use Datadog Monitors and Datadog Metrics to improve uptime and better understand the scope of the issue.

### Datadog Metrics

Datadog's Node.js library lets us easily track a variety of custom metrics about our application, giving us insight into both stability issues as well as application usage patterns. We tracked metrics such as document load time (how long it takes for a user to load a code file), the number of concurrent users, the number of code executions, how large document sizes are, and much more.

These metrics are quite helpful when deciding which features to implement next. For example, one of our next planned features was better support for very large input files. Our current YJS implementation works well for small files, but can be quite inefficient and costly for large files. However, after tracking maximum document size metrics, we realized that very few users actually have large input files, so we deprioritized this feature.

### Datadog Monitors

Previously, we didn't know when the IDE went down until someone reported the issue on Github. With Datadog, we used [Datadog Monitors](https://docs.datadoghq.com/monitors/) to set up intelligent alerts to immediately notify a system administrator once the server started slowing down, which helped us resolve downtime much faster.

The most naive way to implement a monitor would be to monitor system metrics such as CPU usage or HTTP response codes. Both Datadog and built-in Azure services could do this, but we found that these basic monitors were insufficient: When the server was overloaded, requests would _slow down_, but the server wouldn't always _crash_. Additionally, an overloaded server didn't always correspond to high CPU usage; sometimes it might be bottlenecked by RAM or I/O or some other unknown reason. Testing HTTP endpoint responsiveness didn't always work either: sometimes the server status page would function fine even if the rest of the server wasn't functioning anymore. As such, our basic monitors often failed to detect downtime.

What we really wanted was to monitor how long it took users to load their files. If it is taking an abnormally large amount of time to load files, the server is probably overloaded or down. Since we already tracked file load time metrics with Datadog, it was very straightforward to add a Datadog monitor to notify a system administrator through email and push notification any time the P95 load time exceeded a certain threshhold. This was a far more effective monitor; in fact, it even detected temporary spikes of high load that the system naturally recovered from after a short amount of time. Previously, we weren't even aware that this was an issue, as if the server was down for only a short period of time and quickly self-recovered later, users most likely would not file a Github issue.

## Code Execution Engine

Our code execution engine is written in Rust and runs on AWS Lambda. We used Datadog's built-in AWS Lambda integration to track execution latency, basic logs, and the number of invocations. Datadog supports more advanced instrumentation in Rust with [OpenTelementry](https://docs.datadoghq.com/tracing/trace_collection/custom_instrumentation/rust/), but we haven't had time to set this up yet. (It is far easier to set up Datadog's advanced instrumentation with more popular languages such as Node.js.)

Metrics such as median and P95 invocation latencies are actually quite helpful. For our use case, there is a tradeoff between cold-start times and median invocation latencies (i.e. warm starts). By using Datadog's metrics, we can make more informed decisions about how to manage this tradeoff.

---

Datadog has helped us reduce downtime, understand how our users use our sit, and prioritize what features to implement next. Check out our [Public Datadog Dashboard](https://p.datadoghq.com/sb/fbf273aa-1551-11ef-87da-da7ad0900002-1c22ffc7d27083c1529726831826065e) to view some of the key metrics we track!
