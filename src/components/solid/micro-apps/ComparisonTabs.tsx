/** @jsxImportSource solid-js */
import { For } from "solid-js";
import type { Component } from "solid-js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/solid/ui/tabs";
import { toolCategories } from "@/data/pages/comparison";

const ComparisonTabs: Component = () => {
  return (
    <Tabs defaultValue="purpose-built" class="w-full">
      <TabsList class="mb-8 w-full justify-start overflow-x-auto pb-2 border-b border-[#ece6de] rounded-none bg-transparent gap-2">
        <For each={toolCategories}>
          {(cat) => (
            <TabsTrigger 
              value={cat.id} 
              class="rounded-t-lg rounded-b-none border border-transparent data-[selected]:border-[#ece6de] data-[selected]:border-b-white data-[selected]:translate-y-[1px] bg-[#faf8f5] data-[selected]:bg-white px-4 py-3"
            >
              {cat.name}
            </TabsTrigger>
          )}
        </For>
      </TabsList>

      <For each={toolCategories}>
        {(cat) => (
          <TabsContent value={cat.id} class="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div class="p-6 sm:p-8 rounded-b-2xl rounded-tr-2xl border border-[#ece6de] bg-white shadow-sm -mt-[1px]">
              <h3 class="font-bruta text-2xl uppercase text-black mb-2">{cat.name}</h3>
              <p class="text-sm font-semibold text-[#9c806d] uppercase tracking-wide mb-6 border-b border-[#ece6de] pb-4">{cat.era}</p>
              
              <div class="grid md:grid-cols-2 gap-8">
                <div>
                  <p class="text-lg text-gray-800 mb-6 leading-relaxed">{cat.description}</p>
                  <div class="bg-[#FFF8E9] p-5 rounded-xl border border-[#ece6de]">
                    <h4 class="font-bold text-[#4a8136] uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                      Best For
                    </h4>
                    <p class="text-gray-700 text-sm leading-relaxed">{cat.bestFor}</p>
                  </div>
                </div>
                
                <div class="space-y-6">
                  <div>
                    <h4 class="font-bold text-[#cb4949] uppercase text-xs tracking-wider mb-3">Critical Limitations</h4>
                    <ul class="space-y-2">
                      <For each={cat.limitations}>
                        {(lim) => (
                          <li class="flex items-start text-sm text-gray-700">
                            <span class="text-[#cb4949] mr-2 mt-0.5 font-bold">×</span>
                            <span>{lim}</span>
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 class="font-bold text-[#9c806d] uppercase text-xs tracking-wider mb-3">Hidden Costs</h4>
                    <ul class="space-y-2">
                      <For each={cat.hiddenCosts}>
                        {(cost) => (
                          <li class="flex items-start text-sm text-gray-700">
                            <span class="text-[#9c806d] mr-2 mt-0.5">•</span>
                            <span>{cost}</span>
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </For>
    </Tabs>
  );
};

export default ComparisonTabs;
