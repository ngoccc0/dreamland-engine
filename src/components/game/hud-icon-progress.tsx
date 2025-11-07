"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HudIconProgressProps {
  Icon?: React.ElementType;
  value: number;
  maxValue: number;
  fillColor?: string;
  statName?: string;
  className?: string;
}

export function HudIconProgress({ value, maxValue, statName, className }: HudIconProgressProps) {
  // Keep API compatible with previous usage while providing the animated heart.
  const nValue = Number(value);
  const nMax = Number(maxValue);
  const raw = (Number.isFinite(nValue) && Number.isFinite(nMax) && nMax !== 0) ? (nValue / nMax) * 100 : 0;
  const percent = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 0));

  // HEART silhouette in 0..100 coordinate space
  const HEART_PATH = 'M50 85 C20 60, 6 42, 20 26 A18 18 0 0 1 50 27 A18 18 0 0 1 80 26 C94 42, 80 60, 50 85 Z';

  // color helpers
  function hexToRgb(hex: string) { const m = hex.replace('#',''); const bigint = parseInt(m,16); return [(bigint>>16)&255, (bigint>>8)&255, bigint&255]; }
  function rgbToHex(r:number,g:number,b:number){ return '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join(''); }
  function mixHex(a:string,b:string,t:number){ const A = hexToRgb(a), B = hexToRgb(b); const R = Math.round(A[0] + (B[0]-A[0])*t); const G = Math.round(A[1] + (B[1]-A[1])*t); const Bc = Math.round(A[2] + (B[2]-A[2])*t); return rgbToHex(R,G,Bc); }

  function computeHealthStops(p: number) {
    const ramp = [
      { p:100, s:['#ff4d4d','#ff1a1a','#b20000'] },
      { p:75,  s:['#ff6b6b','#ff3333','#c11616'] },
      { p:50,  s:['#fff176','#ffd54d','#ffb74d'] },
      { p:30,  s:['#ffb84d','#ff8c00','#cc6600'] },
      { p:0,   s:['#7a0000','#4a0000','#2a0000'] },
    ];
    p = Math.max(0, Math.min(100, p));
    let lo = ramp[0], hi = ramp[ramp.length-1];
    for (let i=0;i<ramp.length-1;i++){
      const a = ramp[i], b = ramp[i+1];
      if (p <= a.p && p >= b.p) { lo = a; hi = b; break; }
      if (p >= a.p && p <= b.p) { lo = a; hi = b; break; }
    }
    let t = 0; if (lo.p === hi.p) t = 0; else t = (p - lo.p) / (hi.p - lo.p);
    t = Math.max(0, Math.min(1, t));
    return [ mixHex(lo.s[0], hi.s[0], t), mixHex(lo.s[1], hi.s[1], t), mixHex(lo.s[2], hi.s[2], t) ];
  }

  // refs
  const stopARef = React.useRef<SVGStopElement | null>(null);
  const stopBRef = React.useRef<SVGStopElement | null>(null);
  const stopCRef = React.useRef<SVGStopElement | null>(null);
  const rectRef = React.useRef<SVGRectElement | null>(null);
  const turbRef = React.useRef<SVGElement | null>(null);
  const dispRef = React.useRef<SVGElement | null>(null);

  // area lookup for perceptual fill mapping
  const areaLookupRef = React.useRef<Array<{h:number, area:number}> | null>(null);

  React.useEffect(() => {
    // build lookup by rasterizing the HEART_PATH into a 200x200 canvas
    let cancelled = false;
    (async () => {
      try {
        const canvas = document.createElement('canvas');
        const samples = 120;
        canvas.width = 200; canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) { areaLookupRef.current = null; return; }
        const ctx2 = ctx as CanvasRenderingContext2D;
        const scale = canvas.width / 100;

        function drawHeart(){
          ctx2.fillStyle = '#fff';
          const p = new Path2D(HEART_PATH);
          ctx2.fill(p);
        }

        ctx.save(); ctx.setTransform(scale,0,0,scale,0,0); ctx.clearRect(0,0,100,100); drawHeart(); ctx.restore();
        const totalImg = ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let totalCount = 0;
        for (let i=3;i<totalImg.length;i+=4) if (totalImg[i] > 10) totalCount++;
        if (totalCount === 0) { areaLookupRef.current = null; return; }

        const table: Array<{h:number,area:number}> = [];
        for (let s=0;s<=samples;s++){
          const hPercent = s / samples * 100;
          ctx.save(); ctx.setTransform(scale,0,0,scale,0,0); ctx.clearRect(0,0,100,100); drawHeart();
          ctx.globalCompositeOperation = 'destination-in';
          // fillRect uses the 0..100 coordinate system
          ctx.fillRect(0, 100 - hPercent, 100, hPercent);
          ctx.restore();
          const img = ctx.getImageData(0,0,canvas.width,canvas.height).data;
          let c = 0;
          for (let i=3;i<img.length;i+=4) if (img[i] > 10) c++;
          table.push({h:hPercent, area: c / totalCount});
        }
        for (let i=1;i<table.length;i++) if (table[i].area < table[i-1].area) table[i].area = table[i-1].area;
        if (!cancelled) areaLookupRef.current = table;
      } catch (e) { areaLookupRef.current = null; }
    })();
    return () => { cancelled = true; };
  }, []);

  function heightForPercentByArea(pct:number){
    const table = areaLookupRef.current;
    if (!table) { const g = 1.22; return Math.pow(pct/100, g) * 100; }
    const target = pct / 100;
    if (target <= 0) return 0; if (target >= 1) return 100;
    // binary search by area to find matching h
    let lo = 0, hi = table.length - 1;
    while (lo <= hi){ const mid = Math.floor((lo+hi)/2); if (table[mid].area < target) lo = mid+1; else hi = mid-1; }
    const i = Math.max(0, hi);
    const a = table[i], b = table[Math.min(table.length-1, i+1)];
    if (!b) return a.h;
    const t = (target - a.area) / (b.area - a.area || 1);
    return a.h + (b.h - a.h) * t;
  }

  // update gradient stops and rect position
  React.useEffect(() => {
    const [cA, cB, cC] = computeHealthStops(percent);
    if (stopARef.current) stopARef.current.setAttribute('stop-color', cA);
    if (stopBRef.current) stopBRef.current.setAttribute('stop-color', cB);
    if (stopCRef.current) stopCRef.current.setAttribute('stop-color', cC);

    const required = heightForPercentByArea(percent);
    const viewH = 100;
    const h = (required/100) * viewH;
    const y = viewH - h;
    if (rectRef.current){ rectRef.current.setAttribute('y', String(y)); rectRef.current.setAttribute('height', String(h)); }
  }, [percent]);

  // wave animation when percent changes
  const lastRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    const prev = lastRef.current; lastRef.current = percent; if (prev === null) return;
    const delta = percent - prev; if (Math.abs(delta) < 0.5) return;
    const disp = dispRef.current; const turb = turbRef.current; if (!disp || !turb) return;
    let rafId: number | null = null;
    const start = performance.now();
    const mag = Math.min(1, Math.abs(delta)/100);
    const maxScale = 25 + mag * 60;
    const baseFreq = 0.015 + mag * 0.02;
    const duration = 1000 + mag * 800;
    function step(now:number){
      const t = Math.min(1, (now-start)/duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const scaleVal = maxScale * (1 - ease);
      const freq = baseFreq * (1 + 0.5 * Math.sin(t * Math.PI * 2));
      if (disp) try { (disp as Element).setAttribute('scale', (scaleVal).toFixed(2)); } catch {};
      if (turb) try { (turb as Element).setAttribute('baseFrequency', freq.toFixed(4)); } catch {};
      if (t < 1) rafId = requestAnimationFrame(step); else {
        try{ if (disp) (disp as Element).setAttribute('scale','0'); } catch {}
        try{ if (turb) (turb as Element).setAttribute('baseFrequency','0.015'); } catch {}
      }
    }
    rafId = requestAnimationFrame(step);
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [percent]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('relative w-10 h-10 flex items-center justify-center', className)} aria-label={`${statName ?? 'HP'}: ${Math.round(percent)}%`}>
            <svg viewBox="0 0 100 100" width="40" height="40" className="block" aria-hidden>
              <defs>
                <linearGradient id="dynGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop ref={stopARef} offset="0%" stopColor="#ff6eb4" />
                  <stop ref={stopBRef} offset="50%" stopColor="#ff2d95" />
                  <stop ref={stopCRef} offset="100%" stopColor="#a4006e" />
                </linearGradient>

                <linearGradient id="metalOutlineGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#59330b" />
                  <stop offset="20%" stopColor="#b06b2f" />
                  <stop offset="45%" stopColor="#ffd39f" />
                  <stop offset="70%" stopColor="#c07a2f" />
                  <stop offset="100%" stopColor="#4b2a06" />
                </linearGradient>

                <filter id="liquidFilter" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
                  <feTurbulence ref={turbRef as any} id="turb" type="fractalNoise" baseFrequency="0.015" numOctaves={2} seed={2} result="noise" />
                  <feDisplacementMap ref={dispRef as any} id="disp" in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
                </filter>

                <filter id="metalSpec" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
                  <feGaussianBlur in="SourceAlpha" stdDeviation={1} result="blur"/>
                  <feSpecularLighting in="blur" surfaceScale={2} specularConstant={0.8} specularExponent={18} lightingColor="#ffffff" result="specOut">
                    <fePointLight x={-50} y={-40} z={80} />
                  </feSpecularLighting>
                  <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specComp" />
                  <feMerge>
                    <feMergeNode in="SourceGraphic" />
                    <feMergeNode in="specComp" />
                  </feMerge>
                </filter>

                <clipPath id="heartClip">
                  <path d={HEART_PATH} />
                </clipPath>
              </defs>

              <g id="fillGroup" clipPath="url(#heartClip)" filter="url(#liquidFilter)">
                <rect ref={rectRef} id="fillRect" x="0" y="0" width="100" height="100" fill="url(#dynGrad)" />
              </g>

              <g filter="url(#metalSpec)">
                <path d={HEART_PATH} fill="none" stroke="url(#metalOutlineGrad)" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
              </g>
            </svg>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statName ?? 'Health'}: {Math.round(percent)}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
