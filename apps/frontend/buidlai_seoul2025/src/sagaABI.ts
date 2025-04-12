export const sagaContractAddress = "0x9a486C66c308db15aD6a3d1aF4cb20244bD1e2c3";

export const sagaABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "runId",
                "type": "uint256"
            }
        ],
        "name": "QueryFinished",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "queryText",
                "type": "string"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "runId",
                "type": "uint256"
            }
        ],
        "name": "QueryInitiated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_runId",
                "type": "uint256"
            }
        ],
        "name": "finishQuery",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "queries",
        "outputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "queryText",
                "type": "string"
            },
            {
                "internalType": "enum QueryProcessor.QueryState",
                "name": "state",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "runId",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_queryText",
                "type": "string"
            }
        ],
        "name": "submitQuery",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]