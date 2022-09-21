import { designGroupName } from "./constants";
import {
  AnnotationSymbol,
  AnnotationSymbolUi,
  SymbolValidationResult,
  UiMessage,
  ValidationError,
} from "./types";

function AnnotationSymbolToUi(symbol: AnnotationSymbol): AnnotationSymbolUi {
  return {
    id: symbol.id,
    name: symbol.mainFrame.name,
    width: symbol.mainFrame.width,
    height: symbol.mainFrame.height,
    designGroupId: symbol.designGroup.id,
    annotationGroupId: symbol.annotationsGroup.id,
    symbolVectorId: symbol.symbolVectorId,
  };
}

function getValidationUiMessage(result: SymbolValidationResult): UiMessage {
  return {
    type: "symbol-validation-result",
    payload: {
      symbol: result.annotationSymbol
        ? AnnotationSymbolToUi(result.annotationSymbol)
        : undefined,
      validationErrors: result.validationErrors,
    },
  };
}

export function validateSelectionAsSymbol(
  nodes: ReadonlyArray<SceneNode>
): void {
  const validationResult = validateSymbol(nodes);
  const msg = getValidationUiMessage(validationResult);
  figma.ui.postMessage(msg);
}

export function validateNodeAsSymbol(nodeId: string): void {
  const node = figma.currentPage.findOne((n) => n.id === nodeId);
  const validationResult = validateSymbol(node ? [node] : []);
  const msg = getValidationUiMessage(validationResult);
  figma.ui.postMessage(msg);
}

export function validateSymbol(
  nodes: ReadonlyArray<SceneNode>
): SymbolValidationResult {
  const selectionErrorMsg: ValidationError = {
    category: "Invalid Selection",
    error:
      "Select a single Frame that contains two Groups: 'Design' and 'Annotations'",
  };

  if (!(nodes.length == 1 && nodes[0].type == "FRAME"))
    return { validationErrors: [selectionErrorMsg] };

  const frame = nodes[0];

  const symbolGroups = frame.children.filter(
    (c) =>
      c.name.toLowerCase() === designGroupName.toLowerCase() &&
      c.type === "GROUP"
  ) as GroupNode[];

  if (symbolGroups.length != 1)
    return { validationErrors: [selectionErrorMsg] };

  const annotationsGroups = frame.children.filter(
    (c) => c.name.toLowerCase() === "annotations" && c.type === "GROUP"
  ) as GroupNode[];

  if (annotationsGroups.length != 1)
    return { validationErrors: [selectionErrorMsg] };

  const errors: ValidationError[] = [];

  const symbol: AnnotationSymbol = {
    id: frame.id,
    mainFrame: frame,
    designGroup: symbolGroups[0],
    annotationsGroup: annotationsGroups[0],
  };

  const symbolVectors = frame.children.filter(
    (c) => c.name.toLowerCase() === "symbol" && c.type === "VECTOR"
  ) as VectorNode[];

  if (symbolVectors.length === 1) symbol.symbolVectorId = symbolVectors[0].id;

  if (symbolVectors.length > 1)
    errors.push({
      category: "Symbol Export Layer",
      error:
        "The Symbol frame contains more than one Symbol Export Layer named 'Symbol'",
    });

  if (frame.width < 24 || frame.height < 24)
    errors.push({
      category: "Frame dimensions",
      error: "The Symbol frame width and height must greater than 24px",
    });

  if (frame.height % 24 !== 0 || frame.width % 24 !== 0)
    errors.push({
      category: "Frame dimensions",
      error: "The Symbol frame width and height must be a multiple of 24",
    });

  return {
    annotationSymbol: symbol,
    validationErrors: errors,
  };
}
