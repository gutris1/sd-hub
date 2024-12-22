onUiLoaded(function () {
  window.getRunningScript = () => () => new Error().stack.match(/(?:[a-z]+:\/\/)?[^ \n]*\.js/)[0];
  var FilePath = getRunningScript()().match(/file=([^\/]+\/[^\/]+)\//);

  if (FilePath) {
    var Path = `file=${FilePath[1]}/`;
    var NameFile = 'uploader-info.json';

    fetch(Path + NameFile)
      .then(response => {
        if (!response.ok) return;
        return response.json();
      })
      .then(data => {
        if (data) {
          const { username, repository, branch } = data;

          const UsernameBox = gradioApp().querySelector('#sdhub-uploader-username-box input');
          const RepoBox = gradioApp().querySelector('#sdhub-uploader-repo-box input');
          const BranchBox = gradioApp().querySelector('#sdhub-uploader-branch-box input');

          const info = [
            { value: username, box: UsernameBox },
            { value: repository, box: RepoBox },
            { value: branch, box: BranchBox }
          ];

          info.forEach(i => {
            if (i.value) {
              i.box.value = i.value;
              updateInput(i.box);
            }
          });
        }
      })
      .catch(error => {
        console.log("Error:", error);
      });
  }
});
