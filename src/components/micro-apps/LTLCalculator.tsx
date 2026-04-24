import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calculator, Info, RotateCcw, Package } from 'lucide-react';

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

export default function LTLCalculator() {
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  const results = useMemo(() => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);
    const wt = parseFloat(weight);

    if (isNaN(l) || isNaN(w) || isNaN(h) || isNaN(wt) || l <= 0 || w <= 0 || h <= 0 || wt <= 0) {
      return null;
    }

    const cubicInches = l * w * h;
    const cubicFeet = cubicInches / 1728;
    const density = wt / cubicFeet;

    const freightClass = DENSITY_TO_CLASS.find((c) => density >= c.min)?.class || '500';

    return {
      cubicFeet: cubicFeet.toFixed(2),
      density: density.toFixed(2),
      freightClass,
    };
  }, [length, width, height, weight]);

  const handleReset = () => {
    setLength('');
    setWidth('');
    setHeight('');
    setWeight('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <Card className="border-2 border-primary/10 shadow-xl overflow-hidden bg-white">
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Calculator className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-recoleta text-primary">LTL Freight Class Calculator</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground max-w-lg">
            Estimate your freight's density and NMFC class by entering its dimensions and weight.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Length (in)</label>
                  <Input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="48"
                    className="h-12 border-primary/20 focus:border-primary focus:ring-primary/20 transition-all rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Width (in)</label>
                  <Input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="48"
                    className="h-12 border-primary/20 focus:border-primary focus:ring-primary/20 transition-all rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Height (in)</label>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="48"
                    className="h-12 border-primary/20 focus:border-primary focus:ring-primary/20 transition-all rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weight (lbs)</label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="500"
                  className="h-12 border-primary/20 focus:border-primary focus:ring-primary/20 transition-all rounded-md"
                />
              </div>

              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full flex items-center gap-2 border-primary/20 hover:bg-primary/5 text-primary h-12 rounded-md transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Calculator
              </Button>
            </div>

            {/* Results Section */}
            <div className="flex flex-col">
              {results ? (
                <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in duration-500 bg-primary/5 rounded-xl p-6 border border-primary/10">
                  <div className="space-y-6 text-center">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Density (PCF)</span>
                      <span className="text-4xl font-bold text-primary">{results.density}</span>
                      <span className="text-sm text-muted-foreground ml-1">lb/ft³</span>
                    </div>

                    <div className="py-4 border-y border-primary/10">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Estimated Freight Class</span>
                      <div className="flex items-center justify-center gap-2">
                        <Package className="h-6 w-6 text-primary" />
                        <span className="text-5xl font-recoleta font-bold text-primary">Class {results.freightClass}</span>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Total Cubic Feet: <span className="font-semibold text-foreground">{results.cubicFeet} ft³</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-primary/10 rounded-xl bg-primary/5 min-h-[250px]">
                  <Calculator className="h-12 w-12 text-primary/20 mb-4" />
                  <p className="text-muted-foreground font-recoleta text-lg">Enter details to see results</p>
                  <p className="text-xs text-muted-foreground/60 max-w-[180px] mt-2">Class is estimated based on standard density scales.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 border-t border-primary/10 p-6">
          <div className="flex gap-3 items-start text-xs text-muted-foreground leading-relaxed">
            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p>
              <strong>Disclaimer:</strong> This tool provides an estimate based on the density of your shipment. Freight classification is also determined by stowability, handling, and liability. Always verify the correct NMFC code for your specific commodity to avoid reclassification fees.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
