function loader(mcVersion)
{
  return {
    windows:require("./lib/windows")(mcVersion)
  }
}

module.exports=loader;