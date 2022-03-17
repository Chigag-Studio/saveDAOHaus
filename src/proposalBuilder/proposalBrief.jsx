import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Flex, Box, Button } from '@chakra-ui/react';

import { CardLabel, ParaMd, ParaSm } from '../components/typography';
import CustomTransfer from './customTransferFactory';
import {
  PropCardCrossChain,
  PropCardOffer,
  PropCardRequest,
} from './proposalBriefPrimitives';

import { CUSTOM_CARD_DATA } from '../data/proposalData';

const ProposalCardBrief = ({ proposal = {}, minionAction }) => {
  const { daochain, daoid } = useParams();
  const isOffering = Number(proposal.tributeOffered) > 0;
  const isRequesting =
    Number(proposal.lootRequested) > 0 ||
    Number(proposal.sharesRequested) > 0 ||
    Number(proposal.paymentRequested) > 0;
  const isCrossChain = proposal.minion?.crossChainMinion;
  const { customTransferUI } = CUSTOM_CARD_DATA[proposal.proposalType] || {};

  return (
    <Flex
      width={['100%', '100%', '60%']}
      minHeight={['10rem', '10rem', '0']}
      justifyContent='space-between'
      borderRight={['none', 'none', '1px solid rgba(255,255,255,0.1)']}
      borderBottom={[
        '1px solid rgba(255,255,255,0.1)',
        '1px solid rgba(255,255,255,0.1)',
        'none',
        'none',
      ]}
      position='relative'
    >
      <Box px='1.2rem' py='0.6rem' w='100%'>
        <Flex
          alignItems='center'
          mb={['4', '4', '4']}
          justifyContent='space-between'
          w='100%'
        >
          <CardLabel>{proposal.proposalType}</CardLabel>
          <DetailsLink proposalId={proposal.proposalId} />
        </Flex>
        <ParaMd
          fontWeight='700'
          mb={['5', '5', '5']}
          fontSize={['1.2rem', '1.2rem', '1.2rem']}
          lineHeight={['1.8rem', '1.8rem', '1.2rem']}
        >
          {proposal.title}
        </ParaMd>
        {isCrossChain && (
          <PropCardCrossChain chainID={daochain} proposal={proposal} />
        )}
        {isRequesting && <PropCardRequest proposal={proposal} />}
        {isOffering && <PropCardOffer proposal={proposal} />}
        {customTransferUI && (
          <CustomTransfer
            proposal={proposal}
            customTransferUI={customTransferUI}
            minionAction={minionAction}
          />
        )}
        <Flex display={['flex', 'flex', 'none']} mb='3'>
          <Button
            as={Link}
            to={`/dao/${daochain}/${daoid}/proposals/${proposal.proposalId}`}
            variant='outline'
            size='sm'
            width='10rem'
            mt={['4', '4', '0']}
          >
            More Details
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default ProposalCardBrief;

const DetailsLink = ({ proposalId }) => {
  const { daochain, daoid } = useParams();
  return (
    <Box display={['none', 'none', 'block']}>
      <Link to={`/dao/${daochain}/${daoid}/proposals/${proposalId}`}>
        <ParaSm>More Details</ParaSm>
      </Link>
    </Box>
  );
};
