import { GameState } from "models/game-state";
import { CharactersState } from "./characters/characters-state";
import { RouteState } from "./route/route-state";

export interface AppState {
    route: RouteState;
    game: GameState;
    characters: CharactersState;
}
