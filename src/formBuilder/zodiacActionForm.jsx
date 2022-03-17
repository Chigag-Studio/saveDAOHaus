import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import ModuleManager from '@gnosis.pm/safe-contracts/build/artifacts/contracts/base/ModuleManager.sol/ModuleManager.json';
import { utils as Web3Utils } from 'web3';

import FormBuilder from './formBuilder';
import { useInjectedProvider } from '../contexts/InjectedProviderContext';
import { useOverlay } from '../contexts/OverlayContext';
import { safeEncodeHexFunction } from '../utils/abi';
import { chainByID } from '../utils/chain';
import {
  createGnosisSafeTxProposal,
  deployZodiacBridgeModule,
  getSafe,
} from '../utils/gnosis';
import { fetchMinionByName } from '../utils/theGraph';

const ZodiacActionForm = props => {
  const {
    currentStep,
    goToNext,
    metaFields,
    next,
    parentForm,
    secondaryBtn,
    setStepperStorage,
  } = props;
  const [formState, setFormState] = useState('idle');
  const { getValues, register, setValue } = parentForm;
  const { address, injectedChain, injectedProvider } = useInjectedProvider();
  const { errorToast, successToast } = useOverlay();
  const { daochain, daoid } = useParams();

  const onSuccess = () => {
    const formValues = getValues();
    if (metaFields) {
      const metaUpdate = metaFields.reduce((update, fieldName) => {
        update[fieldName] = formValues[fieldName];
        return update;
      }, {});
      setStepperStorage(prevState => ({ ...prevState, ...metaUpdate }));
    }
    setFormState('success');
    goToNext(next);
  };

  const prevalidateAmbAction = async (foreignChainId, safeAddress) => {
    // Validate if connected user is a signer of the foreign safe
    const safeSdk = await getSafe({
      chainID: foreignChainId,
      safeAddress, // must be a checksummed address
    });
    if (
      !(await safeSdk.getOwners()).includes(
        Web3Utils.toChecksumAddress(address),
      )
    ) {
      errorToast({
        title: 'Not a Gnosis Safe Signer',
        description: 'You must be a signer on the Gnosis Safe',
      });
      return;
    }

    // Validate if current network matches the selected foreign network
    if (foreignChainId !== injectedChain.chain_id) {
      errorToast({
        title: 'Wrong Chain',
        description: 'Please connect your wallet to the foreign chain.',
      });
      return;
    }
    return true;
  };

  const deployAmbModule = async vault => {
    const formValues = getValues();
    const { foreignChainId, foreignSafeAddress, saltNonce } = formValues;
    const ambConfig = chainByID(daochain).zodiac_amb_module;
    const ambAddress = ambConfig.amb_bridge_address[foreignChainId];

    const ambModuleAddress = await deployZodiacBridgeModule(
      vault.safeAddress, // owner
      foreignSafeAddress, // avatar
      foreignSafeAddress, // target
      ambAddress, // amb
      vault.safeAddress, // controller
      daochain, // chainId
      injectedProvider,
      saltNonce,
    );
    return ambModuleAddress;
  };

  const submitGnosisTxProposal = async (
    foreignChainId,
    functionName,
    functionParams,
    safeAddress,
  ) => {
    const selectedFunction = ModuleManager.abi.find(
      entry => entry.name === functionName,
    );
    const hexData = safeEncodeHexFunction(selectedFunction, [
      Web3Utils.toChecksumAddress(...functionParams),
    ]);
    if (!hexData.encodingError) {
      await createGnosisSafeTxProposal({
        chainID: foreignChainId,
        web3: injectedProvider,
        safeAddress, // must be a checksummed address
        fromDelegate: Web3Utils.toChecksumAddress(address),
        to: safeAddress, // must be a checksummed address
        value: '0',
        data: hexData,
        operation: 0,
      });
      successToast({
        title: 'Cross-chain Minion Summoned.',
        description:
          'Please check the Tx Queue on your Foreign Gnosis Safe for enabling a module.',
      });
      onSuccess();
    }
  };

  const handleActionGoToNext = async () => {
    const formValues = getValues();
    const {
      foreignChainId,
      foreignSafeAddress,
      minionName,
      zodiacAction,
    } = formValues;

    if (zodiacAction === 'ambModule') {
      register('ambModuleAddress');
      const checksumSafeAddr = Web3Utils.toChecksumAddress(foreignSafeAddress);

      if (!prevalidateAmbAction(foreignChainId, checksumSafeAddr)) {
        return;
      }

      setFormState('loading');

      // Fetch Minion Safe that was deployed on a previous step
      const rs = await fetchMinionByName({
        chainID: daochain,
        minionName: minionName.split('/')[1],
        molochAddress: daoid,
      });
      const vault = rs.minions.length && rs.minions[0];
      if (!vault) {
        errorToast({
          title: 'Minion Safe Not Ready',
          description:
            'Your Minion Safe is being setup. Please try again in a few minutes.',
        });
        setFormState('idle');
        return;
      }

      // Deploy a Zodiac Bridge module
      const ambModuleAddress = await deployAmbModule(vault);
      if (!ambModuleAddress) {
        errorToast({
          title: 'AMB Module Deployment',
          description: 'Failed to deploy the AMB Module.',
        });
        setFormState('idle');
        return;
      }
      setValue('ambModuleAddress', ambModuleAddress);

      // Submit a Tx proposal to the foreign Safe in order to add the Bridge contract as a module
      try {
        await submitGnosisTxProposal(
          foreignChainId,
          'enableModule',
          [ambModuleAddress],
          checksumSafeAddr,
        );
      } catch (error) {
        errorToast({
          title: 'Failed to Submit Gnosis Safe Tx Proposal',
          description: error.message,
        });
        setFormState('idle');
      }
    }
  };

  return (
    <FormBuilder
      {...currentStep.form}
      parentForm={parentForm}
      goToNext={handleActionGoToNext}
      next={currentStep.next}
      ctaText={currentStep.ctaText || 'Next'}
      secondaryBtn={secondaryBtn}
      checklist={currentStep.checklist}
      formStateOverride={formState}
    />
  );
};
export default ZodiacActionForm;
