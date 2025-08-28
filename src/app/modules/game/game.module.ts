import { NgModule } from "@angular/core";
import { CommonModule } from "modules/common/common.module";
import { GameComponent } from "./game.component";
import { MorningComponent } from "./components/morning/morning.component";
import { ViewportComponent } from "./components/viewport/viewport.component";
import { CharacterStatsComponent } from "./components/character-stats/character-stats.component";
import { PlayerStatsComponent } from "./components/player-stats/player-stats.component";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    GameComponent,
    MorningComponent,
    ViewportComponent,
    CharacterStatsComponent,
    PlayerStatsComponent
  ],
  exports: [
    GameComponent
  ]
})
export class GameModule { }
