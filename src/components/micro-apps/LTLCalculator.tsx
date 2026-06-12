import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calculator, Info, RotateCcw, Package, Repeat } from 'lucide-react';

const DENSITY_TO_CLASS = [
  { min: 50, class: '50' },
  { min: 35, class: '55' },
  { min: 30, class: '60' },
  { min: 22.5, class: '65' },
  { min: 15, class: '70' },
  { min: 13.5, class: '77.5' },
  { min: 12, class: '85' },
  { min: 10.5, class: '92.5' },
  { min: 9, class: '100' },
  { min: 8, class: '110' },
  { min: 7, class: '125' },
  { min: 6, class: '150' },
  { min: 5, class: '175' },
  { min: 4, class: '200' },
  { min: 3, class: '250' },
  { min: 2, class: '300' },
  { min: 1, class: '400' },
  { min: 0, class: '500' },
];

const LIMITS = {
  imperial: {
    dim: { min: 1, max: 120 },
    weight: { min: 1, max: 10000 },
  },
  metric: {
    dim: { min: 2.5, max: 300 },
    weight: { min: 0.5, max: 4500 },
  },
};

export default function LTLCalculator() {
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  const snapValue = (val: string, type: 'dim' | 'weight', system: 'imperial' | 'metric') => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    
    const limit = LIMITS[system][type];
    if (num < limit.min) return limit.min.toString();
    if (num > limit.max) return limit.max.toString();
    return val;
  };

  const handleBlur = (setter: React.Dispatch<React.SetStateAction<string>>, val: string, type: 'dim' | 'weight') => {
    setter(snapValue(val, type, unitSystem));
  };

  const results = useMemo(() => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);
    const wt = parseFloat(weight);

    if (isNaN(l) || isNaN(w) || isNaN(h) || isNaN(wt) || l <= 0 || w <= 0 || h <= 0 || wt <= 0) {
      return null;
    }

    // Standard NMFC density calculation is in PCF
    let pcf_l = l;
    let pcf_w = w;
    let pcf_h = h;
    let pcf_wt = wt;

    if (unitSystem === 'metric') {
      pcf_l = l / 2.54;
      pcf_w = w / 2.54;
      pcf_h = h / 2.54;
      pcf_wt = wt * 2.20462;
    }

    const cubicInches = pcf_l * pcf_w * pcf_h;
    const cubicFeet = cubicInches / 1728;
    const density = pcf_wt / cubicFeet;

    const freightClass = DENSITY_TO_CLASS.find((c) => density >= c.min)?.class || '500';

    return {
      cubicFeet: cubicFeet.toFixed(2),
      density: density.toFixed(2),
      freightClass,
    };
  }, [length, width, height, weight, unitSystem]);

  const handleReset = () => {
    setLength('');
    setWidth('');
    setHeight('');
    setWeight('');
  };

  const toggleUnits = () => {
    const nextSystem = unitSystem === 'imperial' ? 'metric' : 'imperial';
    
    const convert = (val: string, type: 'dim' | 'weight') => {
      const num = parseFloat(val);
      if (isNaN(num)) return val;
      
      let converted;
      if (nextSystem === 'metric') {
        // Imperial to Metric
        converted = type === 'dim' ? num * 2.54 : num / 2.20462;
      } else {
        // Metric to Imperial
        converted = type === 'dim' ? num / 2.54 : num * 2.20462;
      }
      
      // Round to 1 decimal place and then snap to limits
      const rounded = Math.round(converted * 10) / 10;
      return snapValue(rounded.toString(), type, nextSystem);
    };

    setLength(convert(length, 'dim'));
    setWidth(convert(width, 'dim'));
    setHeight(convert(height, 'dim'));
    setWeight(convert(weight, 'weight'));
    setUnitSystem(nextSystem);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 font-sans not-prose">
      <Card className="border-2 border-primary/10 shadow-xl overflow-hidden bg-white">
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6 px-6 md:px-8">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex flex-row items-center gap-3 h-10">
              <div className="w-10 h-10 bg-primary/10 rounded-lg text-primary flex items-center justify-center flex-shrink-0">
                <Calculator className="h-6 w-6" />
              </div>
              <div className="flex items-center h-10">
                <h2 className="text-2xl md:text-3xl font-recoleta font-bold text-primary leading-none m-0 p-0 relative -top-[4px]">
                  LTL Freight Class
                </h2>
              </div>
            </div>
            
            <div className="flex items-center h-10">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleUnits}
                className="flex items-center gap-2 border-primary/20 hover:bg-primary/5 text-primary h-10 px-4 font-sans font-bold uppercase text-[10px] tracking-[0.1em] shrink-0"
              >
                <Repeat className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{unitSystem === 'imperial' ? 'Switch to Metric' : 'Switch to Imperial'}</span>
                <span className="sm:hidden">{unitSystem === 'imperial' ? 'Metric' : 'Imp'}</span>
              </Button>
            </div>
          </div>
          <CardDescription className="text-muted-foreground max-w-lg mt-4 font-recoleta text-base">
            Estimate density and NMFC class using <span className="font-bold text-foreground underline decoration-primary/20">{unitSystem === 'imperial' ? 'inches/lbs' : 'cm/kg'}</span>.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Input Section */}
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground block leading-tight min-h-[1.5rem]">
                    Length <span className="text-primary/60 text-[9px] block sm:inline">({unitSystem === 'imperial' ? 'inches' : 'cm'})</span>
                  </label>
                  <Input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    onBlur={() => handleBlur(setLength, length, 'dim')}
                    placeholder={unitSystem === 'imperial' ? "48" : "120"}
                    className="h-12 border-primary/10 focus:border-primary focus:ring-primary/20 transition-all rounded-md font-sans font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground block leading-tight min-h-[1.5rem]">
                    Width <span className="text-primary/60 text-[9px] block sm:inline">({unitSystem === 'imperial' ? 'inches' : 'cm'})</span>
                  </label>
                  <Input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    onBlur={() => handleBlur(setWidth, width, 'dim')}
                    placeholder={unitSystem === 'imperial' ? "48" : "120"}
                    className="h-12 border-primary/10 focus:border-primary focus:ring-primary/20 transition-all rounded-md font-sans font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground block leading-tight min-h-[1.5rem]">
                    Height <span className="text-primary/60 text-[9px] block sm:inline">({unitSystem === 'imperial' ? 'inches' : 'cm'})</span>
                  </label>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    onBlur={() => handleBlur(setHeight, height, 'dim')}
                    placeholder={unitSystem === 'imperial' ? "48" : "120"}
                    className="h-12 border-primary/10 focus:border-primary focus:ring-primary/20 transition-all rounded-md font-sans font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground block leading-tight">
                  Weight <span className="text-primary/60">({unitSystem === 'imperial' ? 'lbs' : 'kg'})</span>
                </label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  onBlur={() => handleBlur(setWeight, weight, 'weight')}
                  placeholder={unitSystem === 'imperial' ? "500" : "225"}
                  className="h-12 border-primary/10 focus:border-primary focus:ring-primary/20 transition-all rounded-md font-sans font-medium"
                />
              </div>

              <Button
                variant="ghost"
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 hover:bg-primary/5 text-primary/40 hover:text-primary h-12 rounded-md transition-colors font-bold uppercase text-[10px] tracking-[0.2em]"
              >
                <RotateCcw className="h-3 w-3" />
                Clear All Values
              </Button>
            </div>

            {/* Results Section */}
            <div className="flex flex-col">
              {results ? (
                <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in duration-500 bg-primary/5 rounded-2xl p-6 border border-primary/10">
                  <div className="space-y-8 text-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground block mb-2">Shipment Density</span>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-6xl font-recoleta font-bold text-primary tracking-tight">{results.density}</span>
                        <span className="text-xs font-bold text-primary/60 uppercase">PCF</span>
                      </div>
                    </div>

                    <div className="py-6 border-y border-primary/10">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 block mb-3">Est. NMFC Class</span>
                      <div className="flex items-center justify-center gap-3">
                        <Package className="h-8 w-8 text-primary" />
                        <span className="text-7xl font-recoleta font-bold text-primary tracking-tighter uppercase">{results.freightClass}</span>
                      </div>
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      Total Volume: <span className="text-foreground">{results.cubicFeet} ft³</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-primary/10 rounded-2xl bg-primary/5 min-h-[300px]">
                  <Calculator className="h-16 w-16 text-primary/10 mb-6" />
                  <p className="text-primary/40 font-recoleta text-2xl tracking-tight leading-none mb-2">Awaiting Data</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 max-w-[200px]">Results appear once all shipment details are entered.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/10 border-t border-primary/10 p-6 px-8">
          <div className="flex gap-4 items-start text-xs text-muted-foreground leading-relaxed">
            <div className="p-1.5 bg-primary/5 rounded-full mt-0.5">
              <Info className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            </div>
            <p className="font-medium text-[11px] leading-relaxed">
              <strong className="text-primary font-bold uppercase tracking-wider">Operational Note:</strong> Density is only one of four factors. Stowability, handling, and liability also impact your final class.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
