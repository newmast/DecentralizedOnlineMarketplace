Design pattern decisions

Fail early, fail loud pattern

require() statements are used as soon as possible to ensure that code with invalid parameters is not executed.
Another benefit of the this design pattern is that using require() immediately shows that the function did not execute correctly.

Restricting access pattern

The shop consists of 3 roles - admins, shop owners and normal users. This pattern is utilized to that different roles have access
different functionality in the smart contract. For example:
  - Only admins can add new shop owners and other admins and stop the contract (emergency).
  - Only shop owners can add new shops, edit their products and manage their shops' funds.
  - Normal users can only purchase products from a store.

Emergency stop pattern

In case of emergency an admin can stop the contract. This prevents people from modifiying the state of the contract and disables
all payable functions.
