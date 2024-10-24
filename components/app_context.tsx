import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import mixpanel from "mixpanel-browser";
import { nanoid } from "nanoid";
import { REGIONS } from "./map";

function trackFound(
  userId: string | null,
  index: number,
  foundCount: number,
  hintLevel: HintLevel
) {
  if (foundCount === 0) return;

  const regionInfo = REGIONS[index];
  if (!regionInfo) return;

  const eventName = [
    `Found First Region`,
    `Found Second Region`,
    `Found Third Region`,
    `Found Fourth Region`,
    `Found Fifth Region`,
  ][foundCount - 1];

  mixpanel.track(eventName, {
    color: regionInfo.name,
    hintsCount: hintCount(hintLevel),
    distinct_id: userId,
    $insert_id: `${userId}-${eventName}`,
  });
}

function trackHint(
  userId: string | null,
  regionIndex: number,
  hintLevel: HintLevel
) {
  mixpanel.track("Hint Used", {
    color: REGIONS[regionIndex].name,
    hintsCount: hintCount(hintLevel),
    distinct_id: userId,
    $insert_id: `${userId}-Hint Used-${regionIndex}-${hintLevel}`,
  });
}

export type HintLevel = "none" | "small" | "big";

const incrementHint = (currentLevel: HintLevel): HintLevel => {
  switch (currentLevel) {
    case "none":
      return "small";
    case "small":
      return "big";
    case "big":
      return "big";
    default:
      return "none";
  }
};

export function hintCount(hintLevel: HintLevel): number {
  switch (hintLevel) {
    case "none":
      return 0;
    case "small":
      return 1;
    case "big":
      return 2;
  }
}

interface AppState {
  userId: string | null;
  confettiOnScreen: boolean;
  hints: [HintLevel, HintLevel, HintLevel, HintLevel, HintLevel];
  found: number[];
  revealedImages: number[];
}

type Action =
  | { type: "LOAD_STATE"; payload: AppState }
  | { type: "SET_USER_ID"; payload: string }
  | { type: "RESET_USER_ID" }
  | { type: "INCREASE_HINT"; payload: number }
  | { type: "RESET_HINTS" }
  | { type: "ADD_FOUND"; payload: number }
  | { type: "RESET_FOUND" }
  | { type: "REVEAL_IMAGE"; payload: number }
  | { type: "RESET_REVEALED" }
  | { type: "HIDE_CONFETTI" };

const initialState: AppState = {
  userId: null,
  confettiOnScreen: false,
  hints: ["none", "none", "none", "none", "none"],
  found: [],
  revealedImages: [],
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  setUserId: (userId: string) => void;
  resetUserId: () => void;
  increaseHint: (index: number) => void;
  resetHints: () => void;
  addFound: (index: number) => void;
  resetFound: () => void;
  revealImage: (index: number) => void;
  resetRevealed: () => void;
  hideConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "LOAD_STATE":
      return { ...action.payload };
    case "SET_USER_ID":
      return { ...state, userId: action.payload };
    case "RESET_USER_ID":
      return { ...state, userId: null };
    case "INCREASE_HINT":
      const newHints = [...state.hints] as typeof state.hints;
      newHints[action.payload] = incrementHint(state.hints[action.payload]);
      return { ...state, hints: newHints };
    case "RESET_HINTS":
      return { ...state, hints: initialState.hints };
    case "ADD_FOUND":
      return {
        ...state,
        confettiOnScreen: !state.found.includes(action.payload),
        found: Array.from(new Set([...state.found, action.payload])),
      };
    case "RESET_FOUND":
      return { ...state, found: [] };
    case "REVEAL_IMAGE":
      return {
        ...state,
        revealedImages: Array.from(
          new Set([...state.revealedImages, action.payload])
        ),
      };
    case "RESET_REVEALED":
      return {
        ...state,
        revealedImages: [],
      };
    case "HIDE_CONFETTI":
      return { ...state, confettiOnScreen: false };
    default:
      return state;
  }
};

const LOCAL_STORAGE_KEY = "appState";

const loadState = (): AppState => {
  if (typeof window === "undefined") {
    return initialState;
  }
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedState === null) {
      return initialState;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return initialState;
  }
};

const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const savedState = loadState();
    dispatch({ type: "LOAD_STATE", payload: savedState });
  }, []);

  useEffect(() => {
    saveState(state);
  }, [JSON.stringify(state)]);

  useEffect(() => {
    if (state.userId) return;

    const userId = nanoid(12);
    dispatch({ type: "SET_USER_ID", payload: userId });
  }, [state.userId]);

  const setUserId = (userId: string) => {
    dispatch({ type: "SET_USER_ID", payload: userId });
  };

  const resetUserId = () => {
    dispatch({ type: "RESET_USER_ID" });
  };

  const increaseHint = (index: number) => {
    if (state.hints[index] === "big") return;

    trackHint(state.userId, index, incrementHint(state.hints[index]));
    dispatch({ type: "INCREASE_HINT", payload: index });
  };

  const resetHints = () => {
    dispatch({ type: "RESET_HINTS" });
  };

  const addFound = (index: number) => {
    if (state.found.includes(index)) return;

    trackFound(state.userId, index, state.found.length + 1, state.hints[index]);
    dispatch({ type: "ADD_FOUND", payload: index });
  };

  const resetFound = () => {
    dispatch({ type: "RESET_FOUND" });
  };

  const revealImage = (index: number) => {
    dispatch({ type: "REVEAL_IMAGE", payload: index });
  };

  const resetRevealed = () => {
    dispatch({ type: "RESET_REVEALED" });
  };

  const hideConfetti = () => {
    dispatch({ type: "HIDE_CONFETTI" });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        setUserId,
        resetUserId,
        increaseHint,
        resetHints,
        addFound,
        resetFound,
        revealImage,
        resetRevealed,
        hideConfetti,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
