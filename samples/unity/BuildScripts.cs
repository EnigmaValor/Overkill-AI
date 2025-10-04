using UnityEditor;
using UnityEditor.Build.Reporting;
using System.Linq;

public static class BuildScripts
{
    public static void AndroidBuild()
    {
        string outputPath = "/tmp/unity_build.apk"; // overridden by -customBuildPath
        var scenes = EditorBuildSettings.scenes.Where(s => s.enabled).Select(s => s.path).ToArray();

        var options = new BuildPlayerOptions
        {
            scenes = scenes,
            locationPathName = outputPath,
            target = BuildTarget.Android,
            options = BuildOptions.None
        };

        var report = BuildPipeline.BuildPlayer(options);
        if (report.summary.result != BuildResult.Succeeded)
        {
            throw new System.Exception("Unity build failed: " + report.summary.result);
        }
    }
}
