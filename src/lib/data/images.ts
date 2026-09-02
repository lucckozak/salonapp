const U = "https://images.unsplash.com/";
const q = (id: string, w = 900) =>
  `${U}${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  hero: q("photo-1540555700478-4be289fbecef", 1600),
  heroPortrait: q("photo-1516975080664-ed2fc6a32937", 1200),
  ctaTexture: q("photo-1487412947147-5cebf100ffc2", 1600),

  services: {
    signatureFacial: q("photo-1570172619644-dfd03ed5d881"),
    deepCleansing: q("photo-1596755389378-c31d21fd1273"),
    hydratingFacial: q("photo-1512290923902-8a9f81dc236c"),
    antiAging: q("photo-1519824145371-296894a0daa9"),
    glowPeel: q("photo-1608248543803-ba4f8c70ae0b"),
    classicManicure: q("photo-1604654894610-df63bc536371"),
    gelManicure: q("photo-1519014816548-bf5fe059798b"),
    browShaping: q("photo-1633681926035-ec1ac984418a"),
    lashLift: q("photo-1583001931096-959e9a1a6223"),
    massage: q("photo-1544161515-4ab6ce6db874"),
    scalpTreatment: q("photo-1512207736890-6ffed8a84e8d"),
  },

  staff: {
    sarah: q("photo-1494790108377-be9c29b29330", 600),
    emma: q("photo-1573496359142-b8d87734a5a2", 600),
    maria: q("photo-1580489944761-15a19d654956", 600),
    lina: q("photo-1544005313-94ddf0286df2", 600),
    priya: q("photo-1607746882042-944635dfe10e", 600),
  },
} as const;

/** Soft gradient fallbacks when a remote image fails to load. */
export const GRADIENTS = [
  "linear-gradient(135deg, #f0e8ef 0%, #e6d3ce 100%)",
  "linear-gradient(135deg, #f5e7e3 0%, #e3d9ec 100%)",
  "linear-gradient(135deg, #efe7dd 0%, #e7d9d4 100%)",
  "linear-gradient(135deg, #e9e2f0 0%, #f2e6e2 100%)",
];

export function gradientFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}
