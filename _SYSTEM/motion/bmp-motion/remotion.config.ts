import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(null); // use all cores
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(18);
