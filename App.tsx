import React, { useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { editAccessoryColor } from './services/geminiService';
import { AppState, ColorPreset } from './types';
import { COLOR_PRESETS } from './constants';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  
  const [targetColor, setTargetColor] = useState<string>('');
  const [customColor, setCustomColor] = useState<string>('');
  const [pickerColor, setPickerColor] = useState<string>('#6366f1'); // Default Indigo-500
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const determineClosestAspectRatio = (width: number, height: number): string => {
    const ratio = width / height;
    const supportedRatios = {
      "1:1": 1,
      "3:4": 0.75,
      "4:3": 1.33,
      "9:16": 0.5625,
      "16:9": 1.7778
    };

    let closest = "1:1";
    let minDiff = Number.MAX_VALUE;

    for (const [key, value] of Object.entries(supportedRatios)) {
      const diff = Math.abs(ratio - value);
      if (diff < minDiff) {
        minDiff = diff;
        closest = key;
      }
    }
    return closest;
  };

  const handleImageSelected = (base64: string, type: string) => {
    setOriginalImage(base64);
    setMimeType(type);
    setProcessedImage(null);
    setAppState(AppState.IDLE);
    setTargetColor('');
    setCustomColor('');
    setSelectedPreset(null);

    // Calculate aspect ratio
    const img = new Image();
    img.onload = () => {
      const ar = determineClosestAspectRatio(img.width, img.height);
      setAspectRatio(ar);
    };
    img.src = base64;
  };

  const handlePresetSelect = (preset: ColorPreset) => {
    setSelectedPreset(preset.name);
    setTargetColor(preset.promptValue);
    setCustomColor(''); // Clear custom text if preset selected
    setPickerColor(preset.hex); // Sync picker visual
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomColor(val);
    setTargetColor(val);
    setSelectedPreset(null); // Clear preset if custom typing
    
    // If user types a valid hex, update picker visual
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      setPickerColor(val);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setPickerColor(color);
    setTargetColor(color);
    setCustomColor(color); // Populate text box with hex
    setSelectedPreset(null);
  };

  const handleProcess = async () => {
    if (!originalImage || !targetColor) return;

    setAppState(AppState.PROCESSING);
    setErrorMsg(null);

    try {
      const result = await editAccessoryColor(originalImage, mimeType, targetColor, aspectRatio);
      setProcessedImage(result);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg("处理图片时出错，请重试。");
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setAppState(AppState.IDLE);
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `recolored-accessory-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stage 1: Upload */}
        {!originalImage && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-center">上传您的产品图</h2>
            <p className="text-slate-400 mb-8 text-center max-w-lg">
              使用 AI 智能保留材质纹理，快速更换发饰颜色。
            </p>
            <UploadZone onImageSelected={handleImageSelected} />
          </div>
        )}

        {/* Stage 2 & 3: Editing and Result */}
        {originalImage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            
            {/* Left Sidebar: Controls */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm sticky top-24">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">编辑控制台</h3>
                  <button 
                    onClick={reset}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    重新上传
                  </button>
                </div>

                {/* Preset Colors */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-300">
                    推荐色板
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handlePresetSelect(preset)}
                        className={`
                          group relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all
                          ${selectedPreset === preset.name 
                            ? 'bg-indigo-600/20 ring-2 ring-indigo-500' 
                            : 'hover:bg-slate-700/50'
                          }
                        `}
                      >
                        <div 
                          className="w-8 h-8 rounded-full shadow-sm border border-slate-600/50" 
                          style={{ backgroundColor: preset.hex }} 
                        />
                        <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center group-hover:text-slate-200">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="my-6 border-t border-slate-700/50" />

                {/* Color Picker (New) */}
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-slate-300">
                      自由调色 (点击色块)
                    </label>
                  </div>
                  <div className="relative w-full h-14 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10 group cursor-pointer hover:ring-indigo-500/50 transition-all">
                      <input
                        type="color"
                        value={pickerColor}
                        onChange={handlePickerChange}
                        className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] p-0 m-0 cursor-pointer border-0 opacity-0 z-20"
                      />
                      <div 
                        className="w-full h-full flex items-center justify-between px-4 transition-colors duration-200"
                        style={{ backgroundColor: pickerColor }}
                      >
                         <span className="text-white/90 text-xs font-mono bg-black/40 px-2 py-1 rounded backdrop-blur-md z-10 pointer-events-none shadow-sm">
                          {pickerColor.toUpperCase()}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/80 drop-shadow-md z-10 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                       {/* Subtle gradient overlay for depth */}
                       <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/10 pointer-events-none" />
                  </div>
                </div>

                {/* Custom Text Input */}
                <div className="space-y-2 mt-4">
                  <label className="block text-sm font-medium text-slate-300">
                    或输入颜色描述
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customColor}
                      onChange={handleCustomColorChange}
                      placeholder="颜色代码 或 Rose Gold..."
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    支持 HEX 代码 (如 #FF0000) 或具体英文描述。
                  </p>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleProcess}
                    disabled={!targetColor || appState === AppState.PROCESSING}
                    className={`
                      w-full py-3.5 px-4 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2
                      ${!targetColor || appState === AppState.PROCESSING
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/40 active:transform active:scale-[0.98]'
                      }
                    `}
                  >
                    {appState === AppState.PROCESSING ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        正在生成中...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        开始生成
                      </>
                    )}
                  </button>
                  {errorMsg && (
                    <p className="text-red-400 text-xs mt-3 text-center">{errorMsg}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Canvas/Preview */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-1 min-h-[500px] flex flex-col">
                <div className="flex-1 relative rounded-xl overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-slate-900 flex items-center justify-center">
                  
                  {/* Container for images */}
                  <div className="flex flex-col md:flex-row gap-4 p-4 w-full h-full items-center justify-center">
                    
                    {/* Original */}
                    <div className="relative group max-w-[48%] flex-1">
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white z-10">
                        原图
                      </div>
                      <img 
                        src={originalImage} 
                        alt="Original" 
                        className="w-full h-auto rounded-lg shadow-2xl object-contain max-h-[600px]"
                      />
                    </div>

                    {/* Arrow for Desktop */}
                    {processedImage && (
                      <div className="hidden md:flex text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    )}

                    {/* Processed Result */}
                    {processedImage ? (
                       <div className="relative group max-w-[48%] flex-1 animate-fade-in-up">
                        <div className="absolute top-3 left-3 bg-indigo-600/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white z-10">
                          效果图
                        </div>
                        <img 
                          src={processedImage} 
                          alt="Processed" 
                          className="w-full h-auto rounded-lg shadow-2xl object-contain max-h-[600px] ring-2 ring-indigo-500/50"
                        />
                         <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={downloadImage}
                                className="bg-white text-slate-900 p-2 rounded-full shadow-lg hover:bg-slate-200"
                                title="Download"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                         </div>
                      </div>
                    ) : (
                        appState === AppState.PROCESSING ? (
                             <div className="flex-1 h-full min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/20">
                                <div className="text-center">
                                    <div className="animate-pulse flex space-x-4 mb-4 justify-center">
                                        <div className="rounded-full bg-slate-700 h-12 w-12"></div>
                                    </div>
                                    <p className="text-slate-500 text-sm">AI 正在处理中...</p>
                                </div>
                            </div>
                        ) : (
                             <div className="flex-1 h-full min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/20">
                                <p className="text-slate-600 text-sm">效果图将在这里显示</p>
                             </div>
                        )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;