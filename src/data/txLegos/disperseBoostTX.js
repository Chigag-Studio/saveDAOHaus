import { CONTRACTS } from '../contracts';
import { DETAILS } from '../details';
import { ACTIONS } from '../onTxHashActions';

export const DISPERSE_BOOST_TX = {
  DISPERSE_TOKEN: {
    contract: CONTRACTS.SELECTED_MINION_SAFE,
    name: 'proposeAction',
    poll: 'subgraph',
    onTxHash: ACTIONS.PROPOSAL,
    display: 'Submitting Token Disperse Proposal',
    errMsg: 'Error Token Disperse Proposal',
    successMsg: 'Token Disperse Proposal Submitted!',
    gatherArgs: [
      {
        // _transactions,
        type: 'encodeSafeActions',
        contract: CONTRACTS.LOCAL_SAFE_MULTISEND,
        fnName: 'multiSend',
        to: [
          {
            type: 'nestedArgs',
            gatherArgs: [
              '.values.tokenAddress',
              '.contextData.chainConfig.disperse_app',
            ],
          },
        ],
        value: [
          {
            type: 'nestedArgs',
            gatherArgs: ['0', '0'],
          },
        ],
        data: [
          {
            type: 'nestedArgs',
            gatherArgs: [
              {
                type: 'encodeHex',
                contract: CONTRACTS.ERC_20,
                fnName: 'approve',
                gatherArgs: [
                  '.contextData.chainConfig.disperse_app',
                  '.values.disperseTotal',
                ],
              },
              {
                type: 'encodeHex',
                contract: CONTRACTS.DISPERSE_APP,
                fnName: 'disperseTokenSimple',
                gatherArgs: [
                  '.values.tokenAddress',
                  '.values.userList',
                  '.values.amountList',
                ],
              },
            ],
          },
        ],
        operation: [
          {
            type: 'nestedArgs',
            gatherArgs: ['0', '0'],
          },
        ],
      },
      '.contextData.daoOverview.depositToken.tokenAddress', // _withdrawToken
      0, // _withdrawAmount
      {
        type: 'detailsToJSON',
        gatherFields: DETAILS.DISPERSE_TOKEN,
      },
      true, // _memberOnlyEnabled
    ],
  },
  DISPERSE_ETH: {
    contract: CONTRACTS.SELECTED_MINION_SAFE,
    name: 'proposeAction',
    poll: 'subgraph',
    onTxHash: ACTIONS.PROPOSAL,
    display: 'Submitting ETH Disperse Proposal',
    errMsg: 'Error ETH Disperse Proposal',
    successMsg: 'ETH Disperse Proposal Submitted!',
    gatherArgs: [
      {
        // _transactions,
        type: 'encodeSafeActions',
        contract: CONTRACTS.LOCAL_SAFE_MULTISEND,
        fnName: 'multiSend',
        to: [
          {
            type: 'nestedArgs',
            gatherArgs: ['.contextData.chainConfig.disperse_app'],
          },
        ],
        value: [
          {
            type: 'nestedArgs',
            gatherArgs: ['.values.disperseTotal'],
          },
        ],
        data: [
          {
            type: 'nestedArgs',
            gatherArgs: [
              {
                type: 'encodeHex',
                contract: CONTRACTS.DISPERSE_APP,
                fnName: 'disperseEther',
                gatherArgs: ['.values.userList', '.values.amountList'],
              },
            ],
          },
        ],
        operation: [
          {
            type: 'nestedArgs',
            gatherArgs: ['0'],
          },
        ],
      },
      '.contextData.daoOverview.depositToken.tokenAddress', // _withdrawToken
      0, // _withdrawAmount
      {
        type: 'detailsToJSON',
        gatherFields: DETAILS.DISPERSE_ETH,
      },
      true, // _memberOnlyEnabled
    ],
  },
};
