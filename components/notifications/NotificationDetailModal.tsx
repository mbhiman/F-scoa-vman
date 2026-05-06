"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, Clock, Mail, MessageCircle, Smartphone, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { buttonHover, buttonTap, scaleIn } from "@/lib/animation/animations";
import { fetchNotificationDetail, type Notification } from "@/hooks/useNotifications";

type Props = {
  id: number | null;
  onClose: () => void;
};

const channelIcons = {
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: Smartphone,
};

const statusMeta = {
  SENT: {
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-500",
  },
  FAILED: {
    icon: AlertCircle,
    className: "bg-red-500/10 text-red-500",
  },
  PENDING: {
    icon: Clock,
    className: "bg-amber-500/10 text-amber-500",
  },
  SCHEDULED: {
    icon: CalendarClock,
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString();
};

const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="rounded-xl border border-admin-border bg-admin-primary/5 p-3">
    <p className="text-xs font-medium uppercase tracking-wide text-admin-muted-foreground">{label}</p>
    <p className="mt-1 wrap-break-word text-sm font-semibold text-admin-fg">{value ?? "Not available"}</p>
  </div>
);

export default function NotificationDetailModal({ id, onClose }: Props) {
  const [data, setData] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setData(null);
      setError("");
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");
        setData(await fetchNotificationDetail(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch notification log.");
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [id]);

  const ChannelIcon = data ? channelIcons[data.channel] : Mail;
  const statusEntry =
    data && data.status in statusMeta
      ? statusMeta[data.status as keyof typeof statusMeta]
      : { icon: Clock, className: "bg-admin-primary/10 text-admin-primary" };
  const StatusIcon = data ? statusEntry.icon : Clock;

  return (
    <AnimatePresence>
      {id ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-admin-border bg-admin-card shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-admin-border p-5">
              <div>
                <p className="text-sm font-medium text-admin-muted-foreground">Notification log</p>
                <h2 className="mt-1 text-xl font-semibold text-admin-fg">Delivery Details</h2>
              </div>
              <motion.button
                type="button"
                whileHover={buttonHover}
                whileTap={buttonTap}
                onClick={onClose}
                className="rounded-xl border border-admin-border p-2 text-admin-muted-foreground transition-colors hover:text-admin-primary"
                aria-label="Close notification detail"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="max-h-[calc(90vh-86px)] overflow-y-auto p-5">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="relative h-16 overflow-hidden rounded-xl bg-admin-primary/[0.07]">
                      <motion.div
                        className="absolute inset-0 bg-linear-to-r from-transparent via-admin-card/90 to-transparent dark:via-white/10"
                        initial={{ x: "-120%" }}
                        animate={{ x: "120%" }}
                        transition={{
                          duration: 1.35,
                          repeat: Infinity,
                          ease: "linear",
                          delay: index * 0.05,
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
                  {error}
                </div>
              ) : data ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-admin-primary/10 px-3 py-1.5 text-sm font-semibold text-admin-primary">
                      <ChannelIcon className="h-4 w-4" />
                      {data.channel}
                    </span>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${statusEntry.className}`}>
                      <StatusIcon className="h-4 w-4" />
                      {data.status}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-admin-accent-soft px-3 py-1.5 text-sm font-semibold text-admin-primary">
                      <CalendarClock className="h-4 w-4" />
                      {formatDate(data.sentAt ?? data.createdAt)}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailItem label="Recipient" value={data.recipient} />
                    <DetailItem label="Template" value={data.template} />
                    <DetailItem label="Provider" value={data.provider} />
                    <DetailItem label="Attempts" value={data.attempts} />
                    <DetailItem label="Job ID" value={data.jobId} />
                    <DetailItem label="Job Name" value={data.jobName} />
                    <DetailItem label="Created At" value={formatDate(data.createdAt)} />
                    <DetailItem label="Sent At" value={formatDate(data.sentAt)} />
                  </div>

                  <DetailItem label="Subject" value={data.subject} />

                  {data.errorMessage ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
                      {data.errorMessage}
                    </div>
                  ) : null}

                  <div>
                    <p className="mb-2 text-sm font-semibold text-admin-fg">Provider Response</p>
                    <pre className="max-h-80 overflow-auto rounded-xl border border-admin-border bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                      {JSON.stringify(data.providerResponse ?? {}, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}