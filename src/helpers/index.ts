import { ApprovalTx, ExecutionTx, TxnData } from "./type";

const BASE_URL = "https://bridge-swap.aarc.xyz";
const AARC_API_KEY = "AARC_API_KEY";

export async function getTxnData(ethAmount: string, evm_address: string): Promise<TxnData> {

    // this is considering that everyone will enter ethAmount in decimal places in the frame
    let ethAmountInNumber = Number(ethAmount);
    let finalAmount = ethAmountInNumber * 1e18;

    const queryParameters = new URLSearchParams({
        fromChainId: "10",
        toChainId: "10",
        fromTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        toTokenAddress: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
        routeType: "Value",
        fromAmount: finalAmount.toString(),
        userAddress: evm_address,
        recipient: evm_address
    })

    const endPoint = `${BASE_URL}/deposit-calldata?${queryParameters}`;
    console.log(endPoint);

    let finalResponse: TxnData = {
        success: false,
        data: {
            approvalTxs: [],
            executionTxs: []
        }
    };
    let response;
    let responseInJson;

    try {
        response = await fetch(endPoint, {
            method: "GET",
            headers: {
                "x-api-key": AARC_API_KEY,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
    } catch (e) {
        console.error(e)
    }

    if (response) {
        try {
            responseInJson = await response.json();

            if (responseInJson.success) {

                let approvalTxs = responseInJson.data.approvalTxs;
                let approvalTxsLength = approvalTxs.length;
                for (let i = 0; i < approvalTxsLength; i++) {
                    let approvalTx: ApprovalTx = {
                        target: approvalTxs[i].txTarget,
                        data: approvalTxs[i].txData,
                        value: approvalTxs[i].value,
                        length: approvalTxsLength
                    };
                    finalResponse.data.approvalTxs.push(approvalTx);
                }


                let executionTxs = responseInJson.data.executionTxs;
                let executionTxsLength = executionTxs.length;
                for (let i = 0; i < executionTxsLength; i++) {
                    let executionTx: ExecutionTx = {
                        target: executionTxs[i].txTarget,
                        data: executionTxs[i].txData,
                        value: executionTxs[i].value,
                        length: executionTxsLength
                    };
                    finalResponse.data.executionTxs.push(executionTx);
                }

                finalResponse.success = true;
            } else {
                console.error("Error in fetching")
            }
        } catch (e) {
            console.error(e)
        }
    }
    return finalResponse;
}