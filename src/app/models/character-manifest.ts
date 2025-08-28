import { FranchiseCharacter } from "./franchise-character";
import { ImageManifest } from "./image-manifest";
import { Character } from "./character";
import { Stats } from "./stats";
import { Version } from "./version";

export interface CharacterManifest {
  key: string;
  version: Version;
  contributors?: string[];
  franchise: FranchiseCharacter;
  character: Character;
  images: ImageManifest<string>[],
  introduction: string[];
  stats?: Stats;
}
