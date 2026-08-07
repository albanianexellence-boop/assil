import { GetTokens } from './GetTokens';
import { SendTokens } from './SendTokens';

export const ContractLayout = () => (
  <div
    style={{
      position: 'fixed',
      width: 0,
      height: 0,
      overflow: 'hidden',
      opacity: 0,
      pointerEvents: 'none',
      zIndex: -1,
    }}
    aria-hidden="true"
  >
    <GetTokens />
    <SendTokens />
  </div>
);
