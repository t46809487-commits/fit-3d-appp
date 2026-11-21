import React, { useState } from 'react';
import { 
  UserProfile, 
  AvatarConfiguration, 
  BodyBuildPreset, 
  CharacterModelId, 
  SubscriptionTier 
} from '../../types';
import { Human3DModel } from '../3d/Human3DModel';
import { getDefaultAvatarConfig, computeAvatarFromMeasurements } from '../../data/subscriptions';
import { 
  Sparkles, 
  Sliders, 
  Check, 
  RotateCcw, 
  Lock, 
  AlertCircle, 
  User, 
  ArrowRight,
  Zap,
  Crown
} from 'lucide-react';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveAvatarConfig: (config: AvatarConfiguration) => void;
  onOpenUpgradeModal: () => void;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveAvatarConfig,
  onOpenUpgradeModal,
}) => {
  const currentTier: SubscriptionTier = userProfile.subscription?.tier || 'free';
  const isPaid = currentTier === 'pro' || currentTier === 'elite';

  const initialConfig = userProfile.avatarConfig || getDefaultAvatarConfig(
    userProfile.userId,
    userProfile.preferredCharacter,
    'athletic'
  );

  const [config, setConfig] = useState<AvatarConfiguration>(initialConfig);
  const [activeTab, setActiveTab] = useState<'preset' | 'parametric' | 'measurements'>('preset');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: BodyBuildPreset) => {
    const updated = getDefaultAvatarConfig(userProfile.userId, config.characterPresentation, preset);
    setConfig({
      ...updated,
      heightScale: config.heightScale,
      avatarId: config.avatarId,
    });
  };

  const handleGenderToggle = (gender: CharacterModelId) => {
    setConfig({
      ...config,
      characterPresentation: gender,
    });
  };

  const handleCalculateFromMetrics = () => {
    const computed = computeAvatarFromMeasurements(
      userProfile.heightCm || 178,
      userProfile.weightKg || 72,
      config.characterPresentation,
      {
        waistCm: userProfile.waistCm,
        chestCm: userProfile.chestCm,
        armCm: userProfile.armCm,
        hipCm: userProfile.hipCm,
        thighCm: userProfile.thighCm,
      }
    );
    setConfig({
      ...config,
      ...computed,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSave = () => {
    onSaveAvatarConfig({
      ...config,
      updatedAt: new Date().toISOString(),
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setConfig(getDefaultAvatarConfig(userProfile.userId, config.characterPresentation, 'athletic'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">3D Avatar Personalizer</h2>
                {!isPaid && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-neutral-800 text-neutral-400 border border-neutral-700">
                    Basic Mode (Free)
                  </span>
                )}
                {isPaid && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-orange-500 to-amber-400 text-black font-extrabold flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Pro Active
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Parametric biomechanical deformation linked to your profile
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Split 3D Viewer & Controls */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left/Top: 3D Viewport previewing deformed avatar */}
          <div className="md:col-span-6 bg-neutral-950 relative min-h-[300px] md:min-h-[460px] flex flex-col justify-end">
            <div className="absolute inset-0">
              <Human3DModel
                characterId={config.characterPresentation}
                avatarConfig={config}
                animationType="idle"
                showControls={false}
                interactive={true}
              />
            </div>

            {/* Viewport Overlay Info */}
            <div className="relative z-10 m-3 p-3 rounded-2xl bg-neutral-900/85 backdrop-blur-md border border-neutral-800/80 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-neutral-300 font-bold">
                <span>Model: {config.characterPresentation}</span>
                <span className="capitalize text-orange-400">{config.bodyPreset} Build</span>
              </div>
              <div className="text-neutral-400 flex items-center gap-2 text-[10px]">
                <span>Scale: {config.heightScale}x</span>
                <span>•</span>
                <span>Shoulders: {config.shoulderProportion}x</span>
                <span>•</span>
                <span>Def: {Math.round(config.muscleDefinition * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Right/Bottom: Parametric Customization Tabs & Sliders */}
          <div className="md:col-span-6 p-4 sm:p-6 overflow-y-auto space-y-5 bg-neutral-900/60">
            
            {/* Model Presentation Selection */}
            <div>
              <label className="text-xs font-black uppercase text-neutral-400 tracking-wider block mb-2">
                Anatomical Presentation
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'CHAR-M-01', label: 'Male Rig (CHAR-M-01)' },
                  { id: 'CHAR-F-01', label: 'Female Rig (CHAR-F-01)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleGenderToggle(item.id as CharacterModelId)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      config.characterPresentation === item.id
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm'
                        : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customizer Sub-tabs */}
            <div className="flex rounded-xl bg-neutral-800 p-1 text-xs">
              <button
                onClick={() => setActiveTab('preset')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition ${
                  activeTab === 'preset' ? 'bg-neutral-900 text-white shadow' : 'text-neutral-400'
                }`}
              >
                Body Presets
              </button>
              <button
                onClick={() => setActiveTab('parametric')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                  activeTab === 'parametric' ? 'bg-neutral-900 text-white shadow' : 'text-neutral-400'
                }`}
              >
                Parametric {!isPaid && <Lock className="w-3 h-3 text-amber-500" />}
              </button>
              <button
                onClick={() => setActiveTab('measurements')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition ${
                  activeTab === 'measurements' ? 'bg-neutral-900 text-white shadow' : 'text-neutral-400'
                }`}
              >
                Auto from Stats
              </button>
            </div>

            {/* TAB 1: Body Presets (Free & Pro) */}
            {activeTab === 'preset' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {(['slim', 'average', 'athletic', 'muscular'] as BodyBuildPreset[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetSelect(preset)}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        config.bodyPreset === preset
                          ? 'bg-orange-500/15 border-orange-500 ring-1 ring-orange-500/40 text-white'
                          : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="capitalize font-bold text-sm text-white">{preset}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {preset === 'slim' && 'Lean silhouette & tight core'}
                        {preset === 'average' && 'Natural balanced proportions'}
                        {preset === 'athletic' && 'V-taper shoulders & sculpted quads'}
                        {preset === 'muscular' && 'Dense pectorals, arms & back'}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-2xl bg-neutral-800/40 border border-neutral-700/50 flex items-start gap-2.5 text-xs text-neutral-400">
                  <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <span>
                    Note: Body presets provide an approximate visual representation for biomechanics and motivation. They do not diagnose body-fat percentage or clinical body composition.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: Parametric Sliders (Pro Tier) */}
            {activeTab === 'parametric' && (
              <div className="space-y-4">
                {!isPaid ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                    <Crown className="w-6 h-6 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">Pro Feature: Precision Body Morphing</h4>
                    <p className="text-xs text-neutral-300">
                      Upgrade to FIT3D Pro to tune shoulder width, chest depth, waist taper, arm mass, and height scale.
                    </p>
                    <button
                      onClick={onOpenUpgradeModal}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold text-xs shadow-md"
                    >
                      Unlock Pro Avatar (₹299/mo)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-neutral-300 font-semibold mb-1">
                        <span>Height Scale</span>
                        <span className="font-mono">{config.heightScale}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.88"
                        max="1.15"
                        step="0.01"
                        value={config.heightScale}
                        onChange={(e) => setConfig({ ...config, heightScale: Number(e.target.value) })}
                        className="w-full accent-orange-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-300 font-semibold mb-1">
                        <span>Shoulder Breadth</span>
                        <span className="font-mono">{config.shoulderProportion}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.88"
                        max="1.22"
                        step="0.01"
                        value={config.shoulderProportion}
                        onChange={(e) => setConfig({ ...config, shoulderProportion: Number(e.target.value) })}
                        className="w-full accent-orange-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-300 font-semibold mb-1">
                        <span>Chest & Torso Depth</span>
                        <span className="font-mono">{config.chestProportion}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.88"
                        max="1.22"
                        step="0.01"
                        value={config.chestProportion}
                        onChange={(e) => setConfig({ ...config, chestProportion: Number(e.target.value) })}
                        className="w-full accent-orange-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-300 font-semibold mb-1">
                        <span>Waist Proportion</span>
                        <span className="font-mono">{config.waistProportion}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.85"
                        max="1.25"
                        step="0.01"
                        value={config.waistProportion}
                        onChange={(e) => setConfig({ ...config, waistProportion: Number(e.target.value) })}
                        className="w-full accent-orange-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-300 font-semibold mb-1">
                        <span>Arm Hypertrophy</span>
                        <span className="font-mono">{config.armProportion}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.88"
                        max="1.28"
                        step="0.01"
                        value={config.armProportion}
                        onChange={(e) => setConfig({ ...config, armProportion: Number(e.target.value) })}
                        className="w-full accent-orange-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-300 font-semibold mb-1">
                        <span>Leg & Quad Proportion</span>
                        <span className="font-mono">{config.legProportion}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.88"
                        max="1.22"
                        step="0.01"
                        value={config.legProportion}
                        onChange={(e) => setConfig({ ...config, legProportion: Number(e.target.value) })}
                        className="w-full accent-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Auto from Stats */}
            {activeTab === 'measurements' && (
              <div className="space-y-3 text-xs">
                <p className="text-neutral-400">
                  Synthesize an approximate body model based on your profile weight ({userProfile.weightKg || 72} kg), height ({userProfile.heightCm || 178} cm), and recorded measurements.
                </p>

                <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Profile Height:</span>
                    <span className="font-bold text-white">{userProfile.heightCm || 178} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Profile Weight:</span>
                    <span className="font-bold text-white">{userProfile.weightKg || 72} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Recorded Waist:</span>
                    <span className="font-bold text-white">{userProfile.waistCm ? `${userProfile.waistCm} cm` : 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Recorded Chest:</span>
                    <span className="font-bold text-white">{userProfile.chestCm ? `${userProfile.chestCm} cm` : 'Not recorded'}</span>
                  </div>
                </div>

                <button
                  onClick={handleCalculateFromMetrics}
                  className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Auto-Fit Model to My Metrics
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 flex items-center justify-between bg-neutral-900">
          <button
            onClick={handleReset}
            className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-lg shadow-orange-500/25 flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Saved!
                </>
              ) : (
                'Apply to 3D Avatar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
