import { serveStatic } from '@hono/node-server/serve-static'
import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { NeynarVariables, neynar } from 'frog/middlewares'
import { getTxnData } from './helpers'

export const app = new Frog<{ Variables: NeynarVariables }>()

app.use('/*',
  serveStatic({ root: './public' }),
  neynar({
    apiKey:
      "NEYNAR_API_KEY", features: ['interactor']
  })
)

app.frame('/', (c) => {
  return c.res({
    action: "/finish",
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Swap ETH to USDC
      </div>
    ),
    intents: [
      <TextInput placeholder="Value (ETH)" />,
      <Button.Transaction target="/send-ether">Swap to USDC</Button.Transaction>
    ]
  })
})

app.transaction(
  '/send-ether',
  async (c) => {
    const { inputText } = c;
    const { interactor } = c.var;
    let evm_address;
    let response;

    if (interactor && inputText) {
      evm_address = interactor.verifiedAddresses.ethAddresses[0];
      response = await getTxnData(inputText, evm_address)
    } else {
      response = {
        success: false,
        data: {
          approvalTxs: [],
          executionTxs: []
        }
      }
    }

    if (response.success) {
      // many other conditions are there to handle 
      if (response.data.executionTxs.length == 1) {
        const txn = response.data.executionTxs[0];
        const txTarget = txn.target.substring(2);
        const txData = txn.data.substring(2);
        return c.send({
          chainId: 'eip155:10',
          to: `0x${txTarget}`,
          data: `0x${txData}`,
          value: BigInt(txn.value)
        })
      } else {
        return c.send({
          chainId: 'eip155:10',
          to: "0x",
          data: "0x",
          value: BigInt(0)
        })
      }
    } else {
      return c.send({
        chainId: 'eip155:10',
        to: "0x",
        data: "0x",
        value: BigInt(0)
      })
    }
  }
)

app.frame('/finish', (c) => {
  const { transactionId } = c
  return c.res({
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Transaction ID: {transactionId}
      </div>
    )
  })
})


devtools(app, {
  serveStatic,
  appFid: 14582
})
