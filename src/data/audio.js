// Source recordings are never modified. *_hit is used for receiving damage
// when that character has no separate *_hurt recording.
// Music plays from an MP3 delivery copy of the WAV master (tools/assets/encode_music.py, 9 MB -> 1.4 MB);
// short effects stay WAV: they are small and must start without codec delay.
export const AUDIO = {
 music:'assets/audio/background_audio_level_1/perepoloh_pod_plintusom.mp3',
 buzz:'assets/audio/fly_buzz/fly_buzz.wav',
 footsteps:'assets/audio/people/footsteps_walk.wav',
 stepLeft:'assets/audio/people/footstep_left.wav',
 stepRight:'assets/audio/people/footstep_right.wav',
 goliathAttack:'assets/audio/spiders/goliath_attack.wav',
 goliathHurt:'assets/audio/spiders/goliath_hit.wav',
 harvestmanAttack:'assets/audio/spiders/harvestman_attack.wav',
 harvestmanHurt:'assets/audio/spiders/harvestman_hit.wav',
 jumperAttack:'assets/audio/spiders/jumper_attack.wav',
 jumperHurt:'assets/audio/spiders/jumper_hit.wav',
 karakurtAttack:'assets/audio/spiders/karakurt_attack.wav',
 karakurtHurt:'assets/audio/spiders/karakurt_hit.wav',
 netthrowerAttack:'assets/audio/spiders/netthrower_attack.wav',
 netthrowerHurt:'assets/audio/spiders/netthrower_hit.wav',
 spinnerWeave:'assets/audio/spiders/spinner_weave.wav',
 spitterAttack:'assets/audio/spiders/spitter_attack.wav',
 spitterHurt:'assets/audio/spiders/spitter_hit.wav',
 tarantulaAttack:'assets/audio/spiders/tarantula_burn.wav',
 tarantulaHurt:'assets/audio/spiders/tarantula_hurt.wav',
 wolfAttack:'assets/audio/spiders/wolf_bite.wav',
 wolfHit:'assets/audio/spiders/wolf_hit.wav',
 wolfHurt:'assets/audio/spiders/wolf_hurt.wav'
};
// Loop window inside padded delivery copies: one exact period of the master (start, length in seconds).
export const AUDIO_LOOPS = {music:{start:.25,length:2363077/32000}};
export const AUDIO_MIX = {music:.3,buzz:.16,footsteps:.22,effect:.48,maxVoices:12,maxSynth:10};
