// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract QueryProcessor {
    enum QueryState { Initiated, Finished }
    
    struct Query {
        address user;
        string queryText;
        QueryState state;
        uint256 runId;
    }

    mapping(uint256 => Query) public queries;
    uint256 private runIdCounter;
    address public owner;

    event QueryInitiated(
        address indexed user,
        string queryText,
        uint256 indexed runId
    );
    
    event QueryFinished(
        address indexed user,
        uint256 indexed runId
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // User submits query (frontend sends transaction)
    function submitQuery(string memory _queryText) external {
        uint256 newRunId = runIdCounter;
        queries[newRunId] = Query({
            user: msg.sender,
            queryText: _queryText,
            state: QueryState.Initiated,
            runId: newRunId
        });
        runIdCounter++;
        emit QueryInitiated(msg.sender, _queryText, newRunId);
    }

    // Operator/AI agent completes query
    function finishQuery(address _user, uint256 _runId) external onlyOwner {
        require(_runId < runIdCounter, "Invalid Run ID");
        Query storage query = queries[_runId];
        
        require(query.user == _user, "Address mismatch");
        require(query.state == QueryState.Initiated, "Not initiated");
        
        query.state = QueryState.Finished;
        emit QueryFinished(_user, _runId);
    }
}

