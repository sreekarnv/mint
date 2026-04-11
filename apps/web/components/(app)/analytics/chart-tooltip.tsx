function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];

  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-lg text-left">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
        {entry?.payload?.name as string | undefined}
      </p>
      <p className="text-sm font-semibold text-foreground tabular-nums">
        ${(entry.value as number).toFixed(2)}
      </p>
    </div>
  );
}

export default ChartTooltip;
