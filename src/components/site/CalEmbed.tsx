import { useEffect } from "react";

interface CalEmbedProps {
  namespace: string;
  calLink: string;
  elementId: string;
}

export const CalEmbed = ({ namespace, calLink, elementId }: CalEmbedProps) => {
  useEffect(() => {
    (function (C: any, A: string, L: string) {
      const p = function (a: any, ar: any) { a.q.push(ar); };
      const d = C.document;
      C.Cal = C.Cal || function () {
        const cal = C.Cal;
        const ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api: any = function () { p(api, arguments); };
          const ns = ar[1];
          api.q = api.q || [];
          if (typeof ns === "string") {
            cal.ns[ns] = cal.ns[ns] || api;
            p(cal.ns[ns], ar);
            p(cal, ["initNamespace", ns]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window as any, "https://app.cal.com/embed/embed.js", "init");

    const Cal = (window as any).Cal;
    Cal("init", namespace, { origin: "https://app.cal.com" });
    Cal.ns[namespace]("inline", {
      elementOrSelector: `#${elementId}`,
      config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
      calLink,
    });
    Cal.ns[namespace]("ui", {
      cssVarsPerTheme: {
        light: { "cal-brand": "#2e99f7" },
        dark: { "cal-brand": "#0087ff" },
      },
      hideEventTypeDetails: false,
      layout: "month_view",
    });
  }, [namespace, calLink, elementId]);

  return <div style={{ width: "100%", minHeight: "100%" }} id={elementId} />;
};
