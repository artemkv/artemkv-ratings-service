Ratings Service

Registers the user ratings and returns the avg ratings per item.

Designed to run on 2 instances in 2 different availability zones.
Both instances act as master and replicate date one to another, when the peer is accessible.
If the peer is not accessible, queues messages to replicate until the peer is back online.
Queue is in-memory unless grows too big, in which case it spills on the disk.
Writes every received event into the append-only log file on the disk, to be able to recreate state upon restart.
Upon every restart restores the replication queue, unless it was already spilled on the disk.
Serves actual requests for avg ratings from memory.

# API

TODO:

# Environment Variables

```
NODE_PORT=8600
NODE_IP=localhost
PEER_URL=http://localhost:8200
```
