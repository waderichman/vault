import { DirectiveDocument } from '../types/vault';
import { decryptDocumentToPdf } from './encryption';

export async function prepareDecryptedDocument(document: DirectiveDocument) {
  return decryptDocumentToPdf(document);
}
