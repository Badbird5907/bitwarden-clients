import AutofillField from "../../models/autofill-field";
import AutofillForm from "../../models/autofill-form";
import AutofillPageDetails from "../../models/autofill-page-details";
import { ElementWithOpId, FormFieldElement } from "../../types";

type AutofillFormElements = Map<ElementWithOpId<HTMLFormElement>, AutofillForm>;

type AutofillFieldElements = Map<ElementWithOpId<FormFieldElement>, AutofillField>;

type UpdateAutofillDataAttributeParams = {
  element: ElementWithOpId<HTMLFormElement | FormFieldElement>;
  attributeName: string;
  dataTarget?: AutofillForm | AutofillField;
  dataTargetKey?: string;
};

interface CollectAutofillContentService {
  autofillFormElements: AutofillFormElements;
  getPageDetails(): Promise<AutofillPageDetails>;
  getAutofillFieldElementByOpid(opid: string): HTMLElement | null;
  deepQueryElements<T>(
    root: Document | ShadowRoot | Element,
    selector: string,
    isObservingShadowRoot?: boolean,
  ): T[];
  queryAllTreeWalkerNodes(
    rootNode: Node,
    filterCallback: CallableFunction,
    isObservingShadowRoot?: boolean,
  ): Node[];
  destroy(): void;
}

export {
  AutofillFormElements,
  AutofillFieldElements,
  UpdateAutofillDataAttributeParams,
  CollectAutofillContentService,
};
