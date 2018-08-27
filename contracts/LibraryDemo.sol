pragma solidity ^0.4.24;

library Math {
  function times(int256 a, int256 b) public pure returns (int256) {
    return a * b;
  }

  function minus(int256 a, int256 b) public pure returns (int256) {
    return a - b;
  }

  function plus(int256 a, int256 b) public pure returns (int256) {
    return a + b;
  }
}
