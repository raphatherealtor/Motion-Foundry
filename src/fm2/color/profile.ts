/** Asset metadata policy only; this does not parse ICC blobs or implement wide gamut. */
export function profileCapabilities(assets:{id:string;profile:'srgb'|'untagged'|'display-p3'|'other-icc'|'unknown'}[]){
 const allowed=new Set(['srgb','untagged','display-p3','other-icc','unknown']);
 if(assets.some(a=>!a.id||!allowed.has(a.profile)))throw Error('TYPE_INVALID: asset profile metadata');
 const warnings=assets.filter(a=>!['srgb','untagged'].includes(a.profile)).map(a=>({asset_id:a.id,status:'WARN',detail:a.profile==='unknown'?'ASSET_COLOR_PROFILE_UNVERIFIED':'OUTSIDE_SRGB_WIDE_GAMUT_DEFERRED'}));
 return {working_space:'linear-srgb',output_space:'srgb',icc_decode:'browser-managed; not an independent ICC transform',wide_gamut:false,status:warnings.length?'WARN':'PASS',assets,warnings};
}
